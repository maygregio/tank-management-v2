#!/usr/bin/env python3
"""
Generate a dummy Camin Cargo Control Load Report PDF.
Based on petroleum industry standards (API MPMS Chapter 17).
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime, timedelta
import random

def generate_report():
    filename = "/Users/mayara/Documents/tank-management-v2/camin_cargo_load_report.pdf"
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=6,
        textColor=colors.HexColor('#1a365d')
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=12,
        textColor=colors.HexColor('#4a5568')
    )

    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=11,
        spaceBefore=12,
        spaceAfter=6,
        textColor=colors.HexColor('#1a365d'),
        borderPadding=4,
        backColor=colors.HexColor('#e2e8f0')
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        leading=12
    )

    elements = []

    # Header
    header_data = [
        [
            Paragraph("<b>CAMIN CARGO CONTROL, INC.</b>", title_style),
        ],
        [
            Paragraph("Independent Inspection & Testing Services", subtitle_style),
        ],
        [
            Paragraph("Houston, TX | Tel: (713) 944-1500 | Fax: (713) 944-6747",
                     ParagraphStyle('Contact', fontSize=8, alignment=TA_CENTER)),
        ]
    ]

    header_table = Table(header_data, colWidths=[7.5*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.1*inch))

    # Report title box
    report_title = Table(
        [[Paragraph("<b>SHORE TANK INSPECTION REPORT - LOADING</b>",
                   ParagraphStyle('ReportTitle', fontSize=12, alignment=TA_CENTER, textColor=colors.white))]],
        colWidths=[7.5*inch]
    )
    report_title.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1a365d')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(report_title)
    elements.append(Spacer(1, 0.15*inch))

    # Generate dummy data
    report_date = datetime.now()
    load_start = report_date - timedelta(hours=8)
    load_end = report_date - timedelta(hours=2)
    report_number = f"CCC-{report_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

    # General Information
    general_info = [
        ['Report Number:', report_number, 'Report Date:', report_date.strftime('%B %d, %Y')],
        ['Client:', 'Valero Energy Corporation', 'Terminal:', 'Houston Ship Channel Terminal'],
        ['Vessel:', 'M/T ATLANTIC VOYAGER', 'Berth:', 'Dock 7'],
        ['Product:', 'Light Sweet Crude Oil', 'Grade:', 'West Texas Intermediate (WTI)'],
        ['Nomination:', 'NOM-2026-0117-4521', 'B/L Number:', 'BL-HSC-2026-00892'],
    ]

    gen_table = Table(general_info, colWidths=[1.3*inch, 2.45*inch, 1.3*inch, 2.45*inch])
    gen_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f7fafc')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f7fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(gen_table)
    elements.append(Spacer(1, 0.15*inch))

    # Timeline Information
    timeline_header = Table(
        [[Paragraph("<b>OPERATION TIMELINE</b>",
                   ParagraphStyle('SectionTitle', fontSize=10, alignment=TA_LEFT, textColor=colors.HexColor('#1a365d')))]],
        colWidths=[7.5*inch]
    )
    timeline_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(timeline_header)

    timeline_data = [
        ['Loading Commenced:', load_start.strftime('%B %d, %Y  %H:%M'),
         'Loading Completed:', load_end.strftime('%B %d, %Y  %H:%M')],
        ['Opening Gauge Time:', (load_start - timedelta(minutes=30)).strftime('%H:%M'),
         'Closing Gauge Time:', (load_end + timedelta(minutes=45)).strftime('%H:%M')],
        ['Samples Drawn:', load_start.strftime('%H:%M') + ' - ' + load_end.strftime('%H:%M'),
         'Weather:', 'Clear, 72°F / 22°C'],
    ]

    timeline_table = Table(timeline_data, colWidths=[1.5*inch, 2.25*inch, 1.5*inch, 2.25*inch])
    timeline_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(timeline_table)
    elements.append(Spacer(1, 0.15*inch))

    # Shore Tank Measurements
    tank_header = Table(
        [[Paragraph("<b>SHORE TANK MEASUREMENTS</b>",
                   ParagraphStyle('SectionTitle', fontSize=10, alignment=TA_LEFT, textColor=colors.HexColor('#1a365d')))]],
        colWidths=[7.5*inch]
    )
    tank_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(tank_header)

    # Tank measurement headers
    tank_col_headers = ['Tank No.', 'Gauge\n(ft-in)', 'Temp\n(°F)', 'TOV\n(Bbls)', 'Free Water\n(in)', 'GOV\n(Bbls)', 'API\nGravity', 'GSV @ 60°F\n(Bbls)']

    # Opening gauges
    elements.append(Paragraph("<b>Opening Gauges:</b>", normal_style))
    opening_data = [
        tank_col_headers,
        ['TK-101', '12-03.5', '78.2', '45,234', '0.25', '45,198', '39.8', '44,876'],
        ['TK-102', '08-07.0', '77.8', '32,156', '0.50', '32,089', '40.1', '31,852'],
        ['TK-105', '15-11.25', '78.5', '58,423', '0.00', '58,423', '39.6', '58,012'],
    ]

    opening_table = Table(opening_data, colWidths=[0.75*inch, 0.8*inch, 0.7*inch, 0.95*inch, 0.85*inch, 0.95*inch, 0.7*inch, 1.1*inch])
    opening_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(opening_table)
    elements.append(Spacer(1, 0.1*inch))

    # Closing gauges
    elements.append(Paragraph("<b>Closing Gauges:</b>", normal_style))
    closing_data = [
        tank_col_headers,
        ['TK-101', '03-02.25', '76.5', '12,345', '0.25', '12,309', '39.8', '12,234'],
        ['TK-102', '02-08.5', '76.2', '10,234', '0.50', '10,167', '40.1', '10,089'],
        ['TK-105', '04-05.0', '76.8', '15,678', '0.00', '15,678', '39.6', '15,567'],
    ]

    closing_table = Table(closing_data, colWidths=[0.75*inch, 0.8*inch, 0.7*inch, 0.95*inch, 0.85*inch, 0.95*inch, 0.7*inch, 1.1*inch])
    closing_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(closing_table)
    elements.append(Spacer(1, 0.15*inch))

    # Quantity Summary - NSV Before/After Load Table
    qty_header = Table(
        [[Paragraph("<b>QUANTITY DETERMINATION - SHORE FIGURES</b>",
                   ParagraphStyle('SectionTitle', fontSize=10, alignment=TA_LEFT, textColor=colors.HexColor('#1a365d')))]],
        colWidths=[7.5*inch]
    )
    qty_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(qty_header)

    # Main NSV Before/After table
    nsv_data = [
        ['Tank No.', 'NSV Before Load\n@ 60°F (Bbls)', 'NSV After Load\n@ 60°F (Bbls)', 'Net Loaded\nNSV (Bbls)', 'S&W\n(%)', 'API\nGravity'],
        ['TK-101', '44,719', '12,191', '32,528', '0.35', '39.8'],
        ['TK-102', '31,750', '10,057', '21,693', '0.32', '40.1'],
        ['TK-105', '57,792', '15,508', '42,284', '0.38', '39.6'],
        ['TOTAL', '134,261', '37,756', '96,505', '0.35 avg', '39.8 avg'],
    ]

    nsv_table = Table(nsv_data, colWidths=[0.9*inch, 1.4*inch, 1.4*inch, 1.3*inch, 0.8*inch, 0.8*inch])
    nsv_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#c6f6d5')),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(nsv_table)
    elements.append(Spacer(1, 0.1*inch))

    # Detailed volume breakdown
    elements.append(Paragraph("<b>Volume Calculation Detail:</b>", normal_style))

    detail_data = [
        ['Description', 'TK-101', 'TK-102', 'TK-105', 'TOTAL'],
        ['Opening TOV (Bbls)', '45,234', '32,156', '58,423', '135,813'],
        ['Opening Free Water (Bbls)', '36', '67', '0', '103'],
        ['Opening GOV (Bbls)', '45,198', '32,089', '58,423', '135,710'],
        ['Opening GSV @ 60°F (Bbls)', '44,876', '31,852', '58,012', '134,740'],
        ['Opening S&W Deduction (Bbls)', '157', '102', '220', '479'],
        ['Opening NSV @ 60°F (Bbls)', '44,719', '31,750', '57,792', '134,261'],
        ['', '', '', '', ''],
        ['Closing TOV (Bbls)', '12,345', '10,234', '15,678', '38,257'],
        ['Closing Free Water (Bbls)', '36', '67', '0', '103'],
        ['Closing GOV (Bbls)', '12,309', '10,167', '15,678', '38,154'],
        ['Closing GSV @ 60°F (Bbls)', '12,234', '10,089', '15,567', '37,890'],
        ['Closing S&W Deduction (Bbls)', '43', '32', '59', '134'],
        ['Closing NSV @ 60°F (Bbls)', '12,191', '10,057', '15,508', '37,756'],
        ['', '', '', '', ''],
        ['NET LOADED NSV @ 60°F (Bbls)', '32,528', '21,693', '42,284', '96,505'],
    ]

    detail_table = Table(detail_data, colWidths=[2.3*inch, 1.3*inch, 1.3*inch, 1.3*inch, 1.3*inch])
    detail_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 5), (-1, 5), 'Helvetica-Bold'),
        ('FONTNAME', (0, 13), (-1, 13), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 5), (-1, 5), colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0, 13), (-1, 13), colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#c6f6d5')),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        # Empty row styling
        ('BACKGROUND', (0, 6), (-1, 6), colors.white),
        ('BACKGROUND', (0, 14), (-1, 14), colors.white),
        ('LINEABOVE', (0, 7), (-1, 7), 0, colors.white),
        ('LINEBELOW', (0, 6), (-1, 6), 0, colors.white),
    ]))
    elements.append(detail_table)
    elements.append(Spacer(1, 0.15*inch))

    # Quality Data
    quality_header = Table(
        [[Paragraph("<b>QUALITY DATA - COMPOSITE SAMPLE</b>",
                   ParagraphStyle('SectionTitle', fontSize=10, alignment=TA_LEFT, textColor=colors.HexColor('#1a365d')))]],
        colWidths=[7.5*inch]
    )
    quality_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(quality_header)

    quality_data = [
        ['Test Parameter', 'Method', 'Result', 'Specification'],
        ['API Gravity @ 60°F', 'ASTM D287', '39.8°', '38.0 - 42.0°'],
        ['Density @ 15°C (kg/m³)', 'ASTM D1298', '825.6', '815 - 840'],
        ['Sediment & Water (%)', 'ASTM D4007', '0.35', '0.50 max'],
        ['Sulfur Content (% wt)', 'ASTM D4294', '0.42', '0.50 max'],
        ['Reid Vapor Pressure (psi)', 'ASTM D323', '7.2', '5.0 - 10.0'],
        ['Pour Point (°F)', 'ASTM D97', '+15', '+20 max'],
        ['Salt Content (PTB)', 'ASTM D3230', '8.5', '15.0 max'],
        ['H2S Content (ppm)', 'ASTM D5705', '< 5', '10 max'],
    ]

    quality_table = Table(quality_data, colWidths=[2.2*inch, 1.3*inch, 1.5*inch, 2.5*inch])
    quality_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (2, 1), (3, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(quality_table)
    elements.append(Spacer(1, 0.15*inch))

    # Remarks
    remarks_header = Table(
        [[Paragraph("<b>REMARKS</b>",
                   ParagraphStyle('SectionTitle', fontSize=10, alignment=TA_LEFT, textColor=colors.HexColor('#1a365d')))]],
        colWidths=[7.5*inch]
    )
    remarks_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(remarks_header)

    remarks_text = """
    1. All measurements performed in accordance with API MPMS Chapter 17.1 and ASTM standards.
    2. Tank capacity tables verified and in agreement with terminal records.
    3. Samples collected using automatic in-line sampler per ASTM D4177.
    4. No contamination or off-spec conditions observed during inspection.
    5. All quality results within contractual specifications.
    6. Shore figures are considered final for billing purposes.
    """

    remarks_style = ParagraphStyle('Remarks', fontSize=8, leading=11, leftIndent=10)
    elements.append(Paragraph(remarks_text, remarks_style))
    elements.append(Spacer(1, 0.2*inch))

    # Certification
    cert_header = Table(
        [[Paragraph("<b>CERTIFICATION</b>",
                   ParagraphStyle('SectionTitle', fontSize=10, alignment=TA_LEFT, textColor=colors.HexColor('#1a365d')))]],
        colWidths=[7.5*inch]
    )
    cert_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(cert_header)

    cert_text = """We hereby certify that we witnessed the above measurements and that this report represents
    an accurate record of the inspection performed. This inspection was conducted as an independent third party
    without interest in the cargo."""

    cert_style = ParagraphStyle('Certification', fontSize=9, leading=12, alignment=TA_LEFT)
    elements.append(Paragraph(cert_text, cert_style))
    elements.append(Spacer(1, 0.3*inch))

    # Signatures
    sig_data = [
        ['_' * 35, '', '_' * 35],
        ['Inspector: Michael R. Thompson', '', 'Reviewed By: Sarah J. Martinez'],
        ['API Certified Petroleum Inspector', '', 'Operations Manager'],
        ['Badge No: CCC-4521', '', 'Date: ' + report_date.strftime('%B %d, %Y')],
    ]

    sig_table = Table(sig_data, colWidths=[3*inch, 1.5*inch, 3*inch])
    sig_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(sig_table)
    elements.append(Spacer(1, 0.2*inch))

    # Footer
    footer_text = """
    <i>This report is issued for the sole use of the client and parties to the transaction. Camin Cargo Control, Inc.
    accepts no liability for any use made of this report by third parties. Sample retention: 90 days from date of analysis.</i>
    """
    footer_style = ParagraphStyle('Footer', fontSize=7, leading=9, alignment=TA_CENTER, textColor=colors.HexColor('#718096'))
    elements.append(Paragraph(footer_text, footer_style))

    # Build PDF
    doc.build(elements)
    print(f"PDF generated: {filename}")
    return filename

if __name__ == "__main__":
    generate_report()
