"""Create a print-ready landscape interview guide from authentic app captures."""
from pathlib import Path
import json
import os
import shutil
import hashlib
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.graphics import renderPDF
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode.qr import QrCodeWidget

ROOT = Path(__file__).resolve().parent.parent
CAPTURES = ROOT / 'docs/handout'
capture = json.loads((CAPTURES / 'capture.json').read_text())
f = capture['facts']
URL = 'https://markcarrollresearch.github.io/Financial/'
OUT = ROOT / 'docs/Financial-Lab-Interview-Guide.pdf'
W, H = landscape(letter)
source_hashes = json.loads((ROOT / 'docs/data.json').read_text())['hashes']
assert hashlib.sha256((ROOT / 'assets/douglas_county_logo.png').read_bytes()).hexdigest() == source_hashes['assets/douglas_county_logo.png']
BURGUNDY = HexColor('#762123')
GREEN = HexColor('#006225')
INK = HexColor('#2B2D2C')
MUTED = HexColor('#59645E')
LINE = HexColor('#DFE4DC')
SOFT = HexColor('#F2F4EE')
PAPER = HexColor('#FAFAF8')
WARN = HexColor('#A64237')
FONT_DIR = Path(os.environ.get('FINANCIAL_HANDOUT_FONT_DIR', '/usr/share/fonts/truetype/liberation'))
pdfmetrics.registerFont(TTFont('Lab', str(FONT_DIR / 'LiberationSans-Regular.ttf')))
pdfmetrics.registerFont(TTFont('LabBold', str(FONT_DIR / 'LiberationSans-Bold.ttf')))
pdfmetrics.registerFontFamily('Lab', normal='Lab', bold='LabBold')

money = lambda n: f'${n/100:,.2f}'
para_records = []

def text(c, value, x, y, size=10, color=INK, bold=False):
    c.setFillColor(color)
    c.setFont('LabBold' if bold else 'Lab', size)
    c.drawString(x, y, value)


def paragraph(c, value, x, top, width, size=10, leading=13, color=INK, bold=False, maximum=None):
    style = ParagraphStyle('copy', fontName='LabBold' if bold else 'Lab', fontSize=size,
                           leading=leading, textColor=color, spaceAfter=0, allowWidows=0,
                           allowOrphans=0)
    p = Paragraph(escape(value).replace('\n', '<br/>'), style)
    _, height = p.wrap(width, 1000)
    if maximum is not None and height > maximum + .1:
        raise ValueError(f'Copy exceeds its design box ({height}>{maximum}): {value}')
    p.drawOn(c, x, top-height)
    para_records.append({'page': c.getPageNumber(), 'x': x, 'top': top, 'width': width,
                         'height': height, 'text': value})
    return height


def badge(c, value, x, y, radius=8.5):
    c.setLineWidth(1.8)
    c.setStrokeColor(HexColor('#FFFFFF'))
    c.setFillColor(BURGUNDY)
    c.circle(x, y, radius, fill=1, stroke=1)
    c.setFillColor(HexColor('#FFFFFF'))
    c.setFont('LabBold', 9)
    c.drawCentredString(x, y-3.1, str(value))


def header(c, number, question, subtitle):
    c.setFillColor(HexColor('#FFFFFF'))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(BURGUNDY)
    c.rect(0, H-5, W, 5, fill=1, stroke=0)
    logo = ImageReader(str(ROOT / 'assets/douglas_county_logo.png'))
    iw, ih = logo.getSize()
    height = 51
    c.drawImage(logo, 28, 534, width=height*iw/ih, height=height, mask='auto')
    text(c, 'DOUGLAS COUNTY | FINANCIAL INTELLIGENCE & CONTROLS LAB', 100, 583, 8.1, GREEN, True)
    text(c, question, 100, 551, 25, INK, True)
    text(c, subtitle, 100, 530, 10.4, MUTED)
    c.setFont('LabBold', 11)
    c.setFillColor(BURGUNDY)
    c.drawRightString(764, 580, f'{number:02d} / 04')
    steps = ['01  OVERVIEW', '02  REVENUE ASSURANCE', '03  RECEIVABLES', '04  DECISION LAB']
    for i, label in enumerate(steps):
        x = 28+i*184
        c.setFillColor(BURGUNDY if i+1 == number else SOFT)
        c.roundRect(x, 503, 181, 16, 3, fill=1, stroke=0)
        text(c, label, x+10, 508, 7.5, HexColor('#FFFFFF') if i+1==number else MUTED, True)


def screenshot(c, shot):
    x, y, width, height = 28, 162, 520, 325
    c.drawImage(str(CAPTURES / shot['filename']), x, y, width=width, height=height, mask='auto')
    c.setStrokeColor(LINE)
    c.setLineWidth(.6)
    c.rect(x, y, width, height, fill=0, stroke=1)
    for pin in shot['pins']:
        px = x+pin['x']/shot['viewport']['width']*width
        py = y+height-pin['y']/shot['viewport']['height']*height
        badge(c, pin['number'], px, py)


def callouts(c, entries):
    for i, (title, copy) in enumerate(entries):
        x, top, width, height = 566, 487-i*110, 198, 104
        c.setFillColor(SOFT)
        c.roundRect(x, top-height, width, height, 6, fill=1, stroke=0)
        badge(c, i+1, x+16, top-18, 8)
        title_h = paragraph(c, title, x+32, top-10, width-43, 11, 12.5, INK, True, maximum=25)
        body_top = top-15-title_h-9
        available = body_top-(top-height+10)
        paragraph(c, copy, x+12, body_top, width-24, 9.7, 12.5, MUTED, maximum=available)


def bottom_box(c, x, width, label, copy, warning=False):
    y, height = 77, 55
    c.setFillColor(HexColor('#F8F1E9') if warning else SOFT)
    c.roundRect(x, y, width, height, 5, fill=1, stroke=0)
    text(c, label.upper(), x+12, y+height-15, 7.7, WARN if warning else GREEN, True)
    paragraph(c, copy, x+12, y+height-23, width-24, 10, 12.8, INK, maximum=29)


def footer(c):
    c.setStrokeColor(LINE)
    c.setLineWidth(.65)
    c.line(28, 65, 764, 65)
    text(c, 'Independent interview concept · Synthetic financial data · Not an official County report.', 28, 50, 9, INK)
    text(c, 'markcarrollresearch.github.io/Financial/', 28, 29, 9.4, GREEN, True)
    c.linkURL(URL, (28, 25, 246, 39), relative=0, thickness=0)
    text(c, 'JAN–SEP 2026  |  AS OF SEP 30', 304, 29, 7.7, MUTED, True)
    text(c, 'SCAN TO EXPLORE', 625, 30, 7.2, MUTED, True)
    qr = QrCodeWidget(URL, barLevel='M')
    bounds = qr.getBounds()
    size = 45
    d = Drawing(size, size, transform=[size/(bounds[2]-bounds[0]), 0, 0, size/(bounds[3]-bounds[1]), 0, 0])
    d.add(qr)
    renderPDF.draw(d, c, 719, 18)
    c.linkURL(URL, (719, 18, 764, 63), relative=0, thickness=0)


pages = [
    {
      'id':'executive', 'question':'Are we spending to plan?',
      'subtitle':'Executive overview · A comparable-period view of performance and priorities',
      'callouts':[
        ('Compare the same period', f"Jan–Sep plan: {money(f['budget'])}.\nExpenses: {money(f['actual'])}.\nThe annual budget is a separate baseline."),
        ('Find the pressure points', f"Expenses are {money(abs(f['variance']))} ({f['variancePct']:.2f}%) above plan. Monthly trends and division filters help focus investigation."),
        ('Prioritize the follow-up', f"{f['exceptionCount']} open issues cover {money(f['underReview'])} under review. Open an issue for its source, owner and required action.")
      ],
      'caption':'Application screenshot · All divisions · Select a division to focus the analysis',
      'takeaway':'Identify which divisions drive the variance, then distinguish timing effects from recurring cost pressure.',
      'guardrail':'Budget minus expenses is the variance. Under-review amounts are not established losses.'
    },
    {
      'id':'revenue', 'question':'Can we account for the cash?',
      'subtitle':'Revenue assurance · Follow collected funds through two separate control stages',
      'callouts':[
        ('Separate ownership', f"County retained: {f['retainedPct']:.1f}% of gross receipts. Agency pass-through funds belong to other agencies; they are not County revenue."),
        ('Read each control stage', f"Bank absolute gaps: {money(f['bankGap'])}.\nGL clearing: {money(f['glGap'])}.\nThese stages are not additive."),
        ('Move from gap to evidence', 'Open a batch to inspect its receipts, banked amount and GL postings. The exception queue provides the accountable owner and follow-up.')
      ],
      'caption':'Application screenshot · All divisions · More batch and exception detail is available below the fold',
      'takeaway':'Trace the discrepancy to source records and assign reconciliation follow-up before drawing a conclusion.',
      'guardrail':'Pending Not Due bank items are excluded. GL maturity uses an illustrative two-calendar-day buffer.'
    },
    {
      'id':'receivables', 'question':'Which balances need action?',
      'subtitle':'Accounts receivable · Reconstruct the balance, then organize collection work',
      'callouts':[
        ('Start with an as-of balance', f"Open receivables: {money(f['openAR'])}. Each invoice is reduced only by payment applications dated on or before September 30."),
        ('Rank the aging exposure', f"Past due: {money(f['overdue'])} ({f['overduePct']:.1f}% of open A/R).\nMore than 90 days overdue: {money(f['ar90'])}. Select a bucket to focus."),
        ('Inspect the payment trail', 'Search, sort and open an invoice to see dated applications and partial payments. The remaining balance drives collection priority.')
      ],
      'caption':'Application screenshot · Fixed Sep 30 balance, including open prior-year invoices · More detail below',
      'takeaway':'Use the aging and invoice evidence to decide which account owner or simulated customer needs the next contact.',
      'guardrail':'Do not add monthly A/R snapshots. A 90+ balance means more than 90 days past due, not a creditworthiness judgment.'
    },
    {
      'id':'decision', 'question':'What changes if we act?',
      'subtitle':'Decision Lab · A transparent comparison of assumed collection outcomes',
      'callouts':[
        ('Make assumptions visible', 'Example shown: raise the 90+ collection assumption from 20% to 50%. Hold the other assumed rates at 80%, 60% and 40%.'),
        ('Compare with a baseline', f"Assumed baseline: {money(f['baseline'])}.\nScenario recovery: {money(f['scenario'])}.\nSource A/R balances stay unchanged."),
        ('See the incremental effect', f"This example adds {money(f['incremental'])} in modeled recovery. Bucket balance × assumed rate produces each segment's result.")
      ],
      'caption':'Application screenshot · Illustrative scenario: 90+ rate = 50%; other defaults retained',
      'takeaway':'Compare collection assumptions and use the source-grounded next actions to plan outreach. This is not a verified forecast.',
      'guardrail':'Human-defined rules; AI-built software. 43 source checks and 38 financial tests passed. Human judgment governs use.',
      'governance':True
    }
]

c = canvas.Canvas(str(OUT), pagesize=(W,H), pageCompression=1)
c.setTitle('Douglas County | Financial Intelligence & Controls Lab — Interview Guide')
c.setAuthor('Independent interview concept — human-directed, AI-assisted development')
c.setSubject('Four-page landscape guide to synthetic financial performance, controls, receivables and scenarios')
for number, page in enumerate(pages,1):
    shot = next(s for s in capture['shots'] if s['id']==page['id'])
    header(c, number, page['question'], page['subtitle'])
    screenshot(c, shot)
    callouts(c, page['callouts'])
    text(c, page['caption'], 28, 147, 7.6, MUTED)
    bottom_box(c, 28, 355, 'Leadership use', page['takeaway'])
    bottom_box(c, 401, 363, 'Human direction & AI governance' if page.get('governance') else 'Financial guardrail', page['guardrail'], warning=not page.get('governance'))
    footer(c)
    c.showPage()
c.save()
(ROOT / 'downloads').mkdir(exist_ok=True)
shutil.copyfile(OUT, ROOT / 'downloads' / OUT.name)
(CAPTURES/'layout.json').write_text(json.dumps(para_records,indent=2)+'\n')
print(f'Built {OUT.name}: 4 landscape Letter pages, {OUT.stat().st_size:,} bytes.')
