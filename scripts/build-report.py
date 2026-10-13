"""Generate the review PDF from the editable Markdown and verified evidence."""
from pathlib import Path
import re
import io
from xml.sax.saxutils import escape
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, NextPageTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage

root = Path(__file__).resolve().parents[1]
out = root / 'output/pdf/Laporan_UTS_Workflow_Proposal_DRAF.pdf'
out.parent.mkdir(parents=True, exist_ok=True)
fonts = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('Arial', str(fonts/'arial.ttf')))
pdfmetrics.registerFont(TTFont('Arial-Bold', str(fonts/'arialbd.ttf')))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial', boldItalic='Arial-Bold')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle('BodyID', fontName='Arial', fontSize=10.5, leading=15.2, spaceAfter=8))
styles.add(ParagraphStyle('TitleID', fontName='Arial-Bold', fontSize=23, leading=29, spaceAfter=20))
styles.add(ParagraphStyle('HeadingID', fontName='Arial-Bold', fontSize=15, leading=20, spaceBefore=17, spaceAfter=9, keepWithNext=True))
styles.add(ParagraphStyle('SubID', fontName='Arial-Bold', fontSize=11.5, leading=16, spaceBefore=11, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle('CellID', fontName='Arial', fontSize=9, leading=12))
styles.add(ParagraphStyle('CaptionID', fontName='Arial', fontSize=9, leading=13, spaceBefore=10, spaceAfter=10))
story = []
def inline(text):
    text = escape(text)
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'`([^`]+)`', r'<font color="#193956">\1</font>', text)
    return text
lines = (root/'docs/LAPORAN_DRAF.md').read_text(encoding='utf-8').splitlines()
i = 0
while i < len(lines):
    line = lines[i].strip()
    if not line: i += 1; continue
    if line.startswith('# '): story.append(Paragraph(inline(line[2:]), styles['TitleID'])); i += 1
    elif line.startswith('## '):
        if line == '## Daftar rujukan': story.append(PageBreak())
        story.append(Paragraph(inline(line[3:]), styles['HeadingID'])); i += 1
    elif line.startswith('### '): story.append(Paragraph(inline(line[4:]), styles['SubID'])); i += 1
    elif line.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].strip().startswith('|'):
            row=[c.strip() for c in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r'[: -]+',c) for c in row): rows.append(row)
            i += 1
        widths=[155,340] if len(rows[0])==2 else [495/len(rows[0])]*len(rows[0])
        data=[[Paragraph(inline(c),styles['CellID']) for c in row] for row in rows]
        table=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
        table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e5ebf0')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#c3ccd5')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
        story.extend([table,Spacer(1,10)])
    else:
        para=[line]; i+=1
        while i<len(lines) and lines[i].strip() and not lines[i].startswith(('#','|')):
            if re.match(r'^\d+\. ', lines[i]): break
            para.append(lines[i].strip()); i+=1
        story.append(Paragraph(inline(' '.join(para)), styles['BodyID']))

story.extend([PageBreak(),Paragraph('Lampiran bukti eksekusi',styles['HeadingID'])])
evidence = root/'docs/bukti'
test_text=(evidence/'hasil-pengujian.txt').read_text(encoding='utf-8').strip()
summary=next(line for line in test_text.splitlines() if 'Tests run:' in line)
story.append(Paragraph(inline(summary),styles['BodyID']))
story.append(Paragraph('Pengujian dijalankan terhadap engine nyata. Daftar uji browser berikut merupakan hasil eksekusi, bukan daftar rencana.',styles['BodyID']))
for line in (evidence/'browser-check.txt').read_text(encoding='utf-8').splitlines():
    story.append(Paragraph(inline(line),styles['CaptionID']))

screens = [
 ('12-hello-world.png','Hello World dan deployment','Respons menunjukkan bahwa aplikasi web dan definisi BPMN aktif.'),
 ('19-diagram-detail.png','Model BPMN executable','Tugas manusia, gateway, loop revisi, serta dua hasil akhir ditampilkan dari XML yang dijalankan engine.'),
 ('03-verifikasi.png','Pengajuan masuk ke verifikasi','Data DEMO menghasilkan tugas sekretaris prodi dan riwayat awal.'),
 ('04-revisi.png','Permintaan revisi','Mahasiswa mendapat tugas untuk memperbaiki isi pengajuan.'),
 ('05-penilaian-dosen.png','Penilaian dosen setelah revisi','Versi pengajuan meningkat; dosen mengisi kesediaan dan nama pembimbing.'),
 ('07-disetujui.png','Proses selesai dengan persetujuan','Riwayat, hasil, dan notifikasi simulasi tersimpan setelah keputusan ketua prodi.'),
 ('08-draf.png','Draf data pembimbingan','Keluaran ditandai sebagai draf demonstrasi, bukan surat resmi.'),
 ('09-ditolak.png','Cabang penolakan','Proses selesai dengan alasan penolakan dan tidak menyediakan draf pembimbingan.'),
 ('18-keadaan-error.png','Penanganan kegagalan API','Kegagalan respons sengaja disimulasikan dalam uji browser untuk memeriksa pesan pemulihan.')]
story.append(NextPageTemplate('landscape'))
for filename,title,caption in screens:
    story.append(PageBreak());story.append(Paragraph(title,styles['HeadingID']))
    original=PILImage.open(evidence/filename)
    w,h=original.size
    if h>950:
        original=original.crop((0,0,w,900)); h=900
        caption += ' Cuplikan bagian atas; screenshot halaman lengkap tersedia pada folder bukti.'
    content=io.BytesIO(); original.save(content,format='PNG'); content.seek(0)
    scale=min(741/w,400/h)
    story.append(Image(content,width=w*scale,height=h*scale,hAlign='LEFT'))
    story.append(Paragraph(caption,styles['CaptionID']))
story.append(PageBreak());story.append(Paragraph('Pemeriksaan tampilan ponsel',styles['HeadingID']))
ims=[]
for file in ['14-mobile-daftar.png','16-mobile-form.png']:
    w,h=PILImage.open(evidence/file).size; scale=min(350/w,400/h)
    ims.append(Image(str(evidence/file),width=w*scale,height=h*scale))
story.append(Table([ims],colWidths=[370,370]))
story.append(Paragraph('Daftar dan formulir pada lebar viewport 390 piksel. Tabel dapat digeser di dalam kontainernya tanpa menyebabkan overflow halaman.',styles['CaptionID']))
def footer(canvas,doc):
    canvas.setFont('Arial',8);canvas.setFillColor(colors.HexColor('#536273'))
    canvas.drawString(50,25,'UTS RPL Lanjut | Draf untuk review | 13 Oktober 2026')
    canvas.drawRightString(canvas._pagesize[0]-50,25,str(doc.page))
doc=BaseDocTemplate(str(out),pagesize=(595.28,841.89),rightMargin=50,leftMargin=50,topMargin=44,bottomMargin=45,title='Implementasi Workflow Proposal Skripsi dengan BPMN dan Spring Boot',author='Draf untuk review mahasiswa')
doc.addPageTemplates([
    PageTemplate(id='portrait',frames=[Frame(50,45,495,752,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],pagesize=(595.28,841.89),onPage=footer),
    PageTemplate(id='landscape',frames=[Frame(50,42,741,515,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],pagesize=(841.89,595.28),onPage=footer)
])
doc.build(story)
print(out)
