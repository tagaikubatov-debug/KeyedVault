"""
rag_notary_engine.py — KeyedVault AI Layer v4
=============================================
Новое в этой версии:
  - Кыргызский язык (ky) вместо казахского
  - PDF экспорт нотариальных документов
  - RAG ingestion — загрузка своих файлов в базу знаний
  - История сессии хранится на фронте (sessionStorage)

Запуск:  py -3.11 rag_notary_engine.py
Порт:    8001
"""

import os, io, time, logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import anthropic
from sentence_transformers import SentenceTransformer
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ─── Настройки ────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL      = "claude-sonnet-4-5"
KNOWLEDGE_DIR     = Path(__file__).parent / "legal_knowledge_base"
EMBED_MODEL       = "paraphrase-multilingual-MiniLM-L12-v2"
CLIP_MODEL_NAME   = "openai/clip-vit-base-patch32"
PORT              = 8001

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("keyed")


# ─── Состояние ────────────────────────────────────────────────────────────
class AppState:
    claude:     Optional[anthropic.Anthropic]   = None
    embedder:   Optional[SentenceTransformer]   = None
    clip:       Optional[CLIPModel]             = None
    processor:  Optional[CLIPProcessor]         = None
    chunks:     list[str]                       = []
    embeddings: Optional[np.ndarray]            = None

state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Загружаю модели...")
    if ANTHROPIC_API_KEY:
        state.claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        log.info("✅  Claude подключён (%s)", CLAUDE_MODEL)
    else:
        log.warning("⚠️  ANTHROPIC_API_KEY не найден!")

    state.embedder = SentenceTransformer(EMBED_MODEL)
    log.info("✅  Текстовая модель загружена")

    state.clip      = CLIPModel.from_pretrained(CLIP_MODEL_NAME)
    state.processor = CLIPProcessor.from_pretrained(CLIP_MODEL_NAME)
    state.clip.eval()
    log.info("✅  CLIP загружен")

    state.chunks, state.embeddings = _build_index()
    log.info("✅  База знаний: %d фрагментов", len(state.chunks))
    log.info("🚀  Сервер запущен → http://localhost:%d/docs", PORT)
    yield
    log.info("Остановка...")


app = FastAPI(title="KeyedVault AI Layer v4", version="4.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ─── База знаний ──────────────────────────────────────────────────────────
def _build_index() -> tuple[list[str], np.ndarray]:
    if not KNOWLEDGE_DIR.exists():
        KNOWLEDGE_DIR.mkdir(parents=True)
        return [], np.zeros((0, 384))
    chunks = []
    for path in sorted(KNOWLEDGE_DIR.glob("**/*.txt")):
        text = path.read_text(encoding="utf-8").strip()
        for i in range(0, len(text), 700):
            chunk = text[i:i+800].strip()
            if chunk:
                chunks.append(f"[{path.stem}]\n{chunk}")
    if not chunks:
        return [], np.zeros((0, 384))
    vecs = state.embedder.encode(chunks, normalize_embeddings=True, show_progress_bar=False)
    return chunks, np.array(vecs)


def _rebuild_index():
    """Перестраивает индекс после добавления новых файлов."""
    state.chunks, state.embeddings = _build_index()
    log.info("Индекс перестроен: %d чанков", len(state.chunks))


def _find_relevant(query: str, top_k: int = 4) -> list[str]:
    if state.embeddings is None or len(state.chunks) == 0:
        return []
    q      = state.embedder.encode([query], normalize_embeddings=True)[0]
    scores = state.embeddings @ q
    top    = np.argsort(scores)[::-1][:top_k]
    return [state.chunks[i] for i in top if scores[i] > 0.20]


def _ask_claude(system: str, user: str, max_tokens: int = 1500) -> str:
    if not state.claude:
        raise HTTPException(503, "Claude не подключён. Добавь ANTHROPIC_API_KEY в .env")
    msg = state.claude.messages.create(
        model=CLAUDE_MODEL, max_tokens=max_tokens, system=system,
        messages=[{"role": "user", "content": user}]
    )
    return msg.content[0].text


# ─── Модели данных ────────────────────────────────────────────────────────
class NotaryRequest(BaseModel):
    description: str
    author_id:   str
    asset_hash:  str = ""

class NotaryResponse(BaseModel):
    status:    str
    document:  str
    law_refs:  list[str]
    timestamp: float

class LegalRequest(BaseModel):
    question: str
    context:  str = ""
    language: str = "ru"   # ru / en / ky (кыргызский)

class LegalResponse(BaseModel):
    status:     str
    answer:     str
    sources:    list[str]
    disclaimer: str

class PlagiarismResponse(BaseModel):
    status:         str
    similarity_pct: float
    verdict:        str
    details:        str

class PDFRequest(BaseModel):
    text:     str
    filename: str = "document.pdf"


# ═══════════════════════════════════════════════════════════════════════════
#  НОТАРИУС
# ═══════════════════════════════════════════════════════════════════════════
@app.post("/notary/generate", response_model=NotaryResponse, tags=["Нотариус"])
async def generate_document(req: NotaryRequest):
    relevant = _find_relevant(req.description, top_k=4)
    law_text = "\n\n---\n\n".join(relevant) if relevant else "Используй общие нормы права."

    system = (
        "Ты опытный нотариус с 20-летней практикой в Кыргызской Республике. "
        "Составляй чёткие юридически грамотные документы: заголовок, стороны, суть, "
        "правовое основание, дата и место. "
        "Отвечай на том же языке что и запрос (русский, английский или кыргызский)."
    )
    user = (
        f'Составь нотариальный документ:\n"{req.description}"\n\n'
        f"Автор: {req.author_id}\n"
        + (f"Файл: {req.asset_hash}\n" if req.asset_hash else "")
        + f"\nПравовые нормы:\n{law_text}\n\nВерни только готовый документ."
    )

    document = _ask_claude(system, user, max_tokens=1500)
    sources  = list({c.split("\n")[0].strip("[]") for c in relevant})
    return NotaryResponse(status="SUCCESS", document=document, law_refs=sources, timestamp=time.time())


# ═══════════════════════════════════════════════════════════════════════════
#  PDF ЭКСПОРТ
# ═══════════════════════════════════════════════════════════════════════════
@app.post("/notary/export-pdf", tags=["Нотариус"])
async def export_pdf(req: PDFRequest):
    """PDF с поддержкой кириллицы (DejaVuSans → fallback Helvetica)."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.lib.colors import HexColor
    except ImportError:
        raise HTTPException(503, "reportlab не установлен: pip install reportlab")

    FONT = "Helvetica"; FONT_BOLD = "Helvetica-Bold"
    for path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        str(Path(__file__).parent / "fonts" / "DejaVuSans.ttf"),
    ]:
        bold = path.replace(".ttf", "-Bold.ttf")
        if Path(path).exists():
            try:
                pdfmetrics.registerFont(TTFont("DejaVu", path))
                FONT = "DejaVu"
                if Path(bold).exists():
                    pdfmetrics.registerFont(TTFont("DejaVu-Bold", bold))
                    FONT_BOLD = "DejaVu-Bold"
                break
            except Exception:
                pass

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=2.5*cm, leftMargin=2.5*cm,
                            topMargin=2.5*cm,   bottomMargin=2.5*cm)

    title_s = ParagraphStyle("T", fontName=FONT_BOLD, fontSize=14, leading=20,
                              textColor=HexColor("#1a1a2e"), spaceAfter=12, alignment=TA_CENTER)
    body_s  = ParagraphStyle("B", fontName=FONT, fontSize=10.5, leading=16,
                              textColor=HexColor("#1a1a1a"), alignment=TA_JUSTIFY, spaceAfter=6)
    meta_s  = ParagraphStyle("M", fontName=FONT, fontSize=8.5, leading=12,
                              textColor=HexColor("#888888"), alignment=TA_CENTER)

    def esc(s): return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

    story = []; first = True
    for raw in req.text.split("\n"):
        line = raw.strip()
        if not line:
            story.append(Spacer(1, 6)); continue
        if first:
            story.append(Paragraph(esc(line), title_s))
            story.append(HRFlowable(width="100%", thickness=0.5,
                                    color=HexColor("#cccccc"), spaceAfter=10))
            first = False
        else:
            story.append(Paragraph(esc(line), body_s))

    story += [Spacer(1, 18),
              HRFlowable(width="100%", thickness=0.4, color=HexColor("#dddddd"), spaceAfter=8),
              Paragraph(f"KEYED AI Legal Suite · {req.filename}", meta_s)]
    doc.build(story)
    buf.seek(0)
    safe = req.filename.replace('"','').replace("'","")
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe}"'})

# ═══════════════════════════════════════════════════════════════════════════
#  АДВОКАТ
# ═══════════════════════════════════════════════════════════════════════════
@app.post("/legal/ask", response_model=LegalResponse, tags=["Адвокат"])
async def legal_advisor(req: LegalRequest):
    relevant = _find_relevant(req.question + " " + req.context, top_k=5)
    law_text = "\n\n---\n\n".join(relevant) if relevant else "Используй международное право."

    lang_map = {
        "ru": "Отвечай на русском языке.",
        "en": "Answer in English.",
        "ky": "Кыргыз тилинде жооп бер.",   # кыргызский (не казахский)
    }
    lang = lang_map.get(req.language, "Отвечай на русском языке.")

    system = (
        "Ты опытный международный юрист по правам человека. "
        "Специализация: ЕКПЧ, МУС, система ООН, законодательство Кыргызской Республики. "
        f"Давай практические советы с конкретными статьями и шагами. {lang}"
    )
    user = (
        f'Вопрос: "{req.question}"\n'
        + (f"Контекст: {req.context}\n" if req.context else "")
        + f"\nРелевантные нормы:\n{law_text}\n\nДай развёрнутый практический ответ."
    )

    answer  = _ask_claude(system, user, max_tokens=2000)
    sources = list({c.split("\n")[0].strip("[]") for c in relevant})
    return LegalResponse(
        status="SUCCESS", answer=answer, sources=sources,
        disclaimer="Жооп жалпы укуктук мүнөздө жана лицензияланган адвокаттын кеңешин алмаштырбайт."
    )


# ═══════════════════════════════════════════════════════════════════════════
#  CLIP АНТИПЛАГИАТ
# ═══════════════════════════════════════════════════════════════════════════
@app.post("/plagiarism/check", response_model=PlagiarismResponse, tags=["Антиплагиат"])
async def check_plagiarism(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
):
    if state.clip is None:
        raise HTTPException(503, "CLIP не загружен")
    try:
        img_a = Image.open(io.BytesIO(await file_a.read())).convert("RGB")
        img_b = Image.open(io.BytesIO(await file_b.read())).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"Сүрөттү ачуу мүмкүн болмоду: {e}")

    try:
        with torch.no_grad():
            fa = state.clip.vision_model(**state.processor(images=img_a, return_tensors="pt")).pooler_output
            fb = state.clip.vision_model(**state.processor(images=img_b, return_tensors="pt")).pooler_output
            fa = fa / fa.norm(dim=-1, keepdim=True)
            fb = fb / fb.norm(dim=-1, keepdim=True)
            score = float((fa * fb).sum())
    except Exception as e:
        log.exception("CLIP ошибка")
        raise HTTPException(500, f"CLIP катасы: {e}")

    pct = round(score * 100, 2)
    if score >= 0.95:
        verdict, details = "DUPLICATE", f"Сүрөттөр идентикалуу ({pct}%)."
    elif score >= 0.80:
        verdict, details = "SUSPECT",   f"Жогорку окшоштук ({pct}%) — кол менен текшерүү сунушталат."
    else:
        verdict, details = "ORIGINAL",  f"Сүрөттөр айырмаланат ({pct}%). Плагиат күмөндүү."

    return PlagiarismResponse(status="SUCCESS", similarity_pct=pct, verdict=verdict, details=details)


# ═══════════════════════════════════════════════════════════════════════════
#  RAG: ЗАГРУЗКА ФАЙЛА В БАЗУ ЗНАНИЙ
# ═══════════════════════════════════════════════════════════════════════════
@app.post("/knowledge/ingest", tags=["База знаний"])
async def ingest_file(file: UploadFile = File(...)):
    """
    Загружает .txt или .pdf файл в legal_knowledge_base/ и перестраивает индекс.
    Поддерживает: .txt, .pdf (если установлен PyMuPDF)
    """
    fname  = file.filename or "upload.txt"
    suffix = Path(fname).suffix.lower()

    if suffix not in {".txt", ".pdf"}:
        raise HTTPException(400, "Поддерживаются только .txt и .pdf файлы")

    content = await file.read()

    # PDF → текст
    if suffix == ".pdf":
        try:
            import fitz  # PyMuPDF
            doc   = fitz.open(stream=content, filetype="pdf")
            text  = "\n".join(page.get_text() for page in doc)
            doc.close()
        except ImportError:
            raise HTTPException(503, "PyMuPDF не установлен. Запусти: py -3.11 -m pip install pymupdf")
    else:
        text = content.decode("utf-8", errors="ignore")

    if len(text.strip()) < 50:
        raise HTTPException(400, "Файл слишком короткий или пустой")

    # Сохраняем в базу знаний
    safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in Path(fname).stem)
    save_path = KNOWLEDGE_DIR / f"user_{safe_name}.txt"
    KNOWLEDGE_DIR.mkdir(exist_ok=True)
    save_path.write_text(text, encoding="utf-8")

    # Перестраиваем индекс
    _rebuild_index()

    return {
        "status":       "SUCCESS",
        "filename":     fname,
        "chunks_added": len([c for c in state.chunks if safe_name in c]),
        "total_chunks": len(state.chunks),
    }


@app.delete("/knowledge/{filename}", tags=["База знаний"])
async def delete_knowledge(filename: str):
    """Удаляет пользовательский файл из базы знаний."""
    path = KNOWLEDGE_DIR / f"user_{filename}.txt"
    if not path.exists():
        raise HTTPException(404, "Файл не найден")
    path.unlink()
    _rebuild_index()
    return {"status": "SUCCESS", "deleted": filename, "total_chunks": len(state.chunks)}


# ─── Health ────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Система"])
async def health():
    return {
        "status":    "ok",
        "claude":    state.claude is not None,
        "model":     CLAUDE_MODEL,
        "clip":      state.clip is not None,
        "embedder":  state.embedder is not None,
        "kb_chunks": len(state.chunks),
    }


if __name__ == "__main__":
    uvicorn.run(
        "rag_notary_engine:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,
        timeout_keep_alive=200,
        workers=1,
    )
