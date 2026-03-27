from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
from typing import Dict, List, Any
import io

class LTKMGenerator:
    """Generate LTKM (Laporan Transaksi Keuangan Mencurigakan) Reports"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#002FA7'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
    def generate_report_pdf(self, report_data: Dict[str, Any]) -> bytes:
        """Generate LTKM report as PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Title
        title = Paragraph("LAPORAN TRANSAKSI KEUANGAN MENCURIGAKAN (LTKM)", self.title_style)
        story.append(title)
        story.append(Spacer(1, 0.2*inch))
        
        # Report Info
        report_info = [
            ["Nomor Laporan:", report_data.get('report_number', 'N/A')],
            ["Tanggal Laporan:", datetime.now().strftime('%d %B %Y')],
            ["Status:", "DRAFT" if not report_data.get('submitted') else "SUBMITTED"],
            ["Tingkat Risiko:", report_data.get('risk_level', 'N/A').upper()],
            ["Skor Risiko:", f"{report_data.get('risk_score', 0):.2f}/100"],
        ]
        
        info_table = Table(report_info, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Entity Information
        story.append(Paragraph("<b>Informasi Entitas Terlapor</b>", self.styles['Heading2']))
        story.append(Spacer(1, 0.1*inch))
        
        entity_data = report_data.get('entity', {})
        entity_info = [
            ["Nama:", entity_data.get('name', 'N/A')],
            ["Jenis:", entity_data.get('entity_type', 'N/A')],
            ["Identifier:", entity_data.get('identifier', 'N/A')],
            ["KYC Verified:", "Ya" if entity_data.get('kyc_verified') else "Tidak"],
        ]
        
        entity_table = Table(entity_info, colWidths=[2*inch, 4*inch])
        entity_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        story.append(entity_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Suspicious Indicators
        story.append(Paragraph("<b>Indikator Kecurigaan</b>", self.styles['Heading2']))
        story.append(Spacer(1, 0.1*inch))
        
        indicators = report_data.get('suspicious_indicators', [])
        for idx, indicator in enumerate(indicators, 1):
            story.append(Paragraph(f"{idx}. {indicator}", self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Transactions Summary
        story.append(Paragraph("<b>Ringkasan Transaksi</b>", self.styles['Heading2']))
        story.append(Spacer(1, 0.1*inch))
        
        transactions = report_data.get('transactions', [])
        story.append(Paragraph(f"Jumlah Transaksi Mencurigakan: {len(transactions)}", self.styles['Normal']))
        
        if transactions:
            total_amount = sum(tx.get('amount', 0) for tx in transactions)
            story.append(Paragraph(f"Total Nilai Transaksi: Rp {total_amount:,.2f}", self.styles['Normal']))
        
        story.append(Spacer(1, 0.3*inch))
        
        # AI/ML Detection Results
        story.append(Paragraph("<b>Hasil Analisis AI/ML</b>", self.styles['Heading2']))
        story.append(Spacer(1, 0.1*inch))
        
        ml_results = report_data.get('ml_analysis', {})
        ml_data = [
            ["Model", "Skor"],
            ["Graph Neural Network (GNN)", f"{ml_results.get('gnn_score', 0):.2f}"],
            ["LSTM Sequence Model", f"{ml_results.get('lstm_score', 0):.2f}"],
            ["Isolation Forest", f"{ml_results.get('isolation_forest_score', 0):.2f}"],
            ["Rule-Based Scoring", f"{ml_results.get('rule_based_score', 0):.2f}"],
        ]
        
        ml_table = Table(ml_data, colWidths=[3*inch, 2*inch])
        ml_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(ml_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Footer
        footer_text = f"""<br/><br/>
        Laporan ini dihasilkan secara otomatis oleh Sistem SATRIA (Software & Technology for Risk Assessment in Indonesia).<br/>
        Generated on: {datetime.now().strftime('%d %B %Y %H:%M:%S')}<br/>
        Confidential - For Official Use Only
        """
        story.append(Paragraph(footer_text, self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def generate_report_data(self, entity: Dict, transactions: List[Dict], 
                            ml_scores: Dict, risk_score: float) -> Dict[str, Any]:
        """Prepare report data structure"""
        
        # Determine suspicious indicators based on ML analysis
        indicators = []
        
        if ml_scores.get('gnn_score', 0) > 60:
            indicators.append("Terdeteksi jaringan transaksi yang mencurigakan (GNN Analysis)")
        
        if ml_scores.get('lstm_score', 0) > 60:
            indicators.append("Pola transaksi tidak normal terdeteksi (LSTM Sequence Analysis)")
        
        if ml_scores.get('isolation_forest_score', 0) > 70:
            indicators.append("Anomali transaksi terdeteksi (Isolation Forest)")
        
        if entity.get('watchlist_match'):
            indicators.append("Entitas cocok dengan daftar watchlist internasional")
        
        # Check for structuring
        near_threshold = [tx for tx in transactions if 80000000 < tx.get('amount', 0) < 100000000]
        if len(near_threshold) >= 3:
            indicators.append("Terindikasi melakukan structuring (pemecahan transaksi)")
        
        # Check for rapid transactions
        if len(transactions) > 10:
            indicators.append("Volume transaksi tinggi dalam periode singkat")
        
        # Determine risk level
        if risk_score >= 75:
            risk_level = "CRITICAL"
        elif risk_score >= 50:
            risk_level = "HIGH"
        elif risk_score >= 25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        report_data = {
            'report_number': f"LTKM-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            'entity': entity,
            'transactions': transactions,
            'suspicious_indicators': indicators if indicators else ["Aktivitas mencurigakan terdeteksi oleh sistem AI"],
            'ml_analysis': ml_scores,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'submitted': False,
            'generated_at': datetime.now().isoformat()
        }
        
        return report_data

# Global LTKM generator instance
ltkm_generator = LTKMGenerator()

import uuid
