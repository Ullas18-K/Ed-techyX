import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to export as printable HTML (for Unicode support)
const exportAsHTMLPrint = (data: {
    title: string;
    subject: string;
    gradeLevel: number | string;
    scenarioDescription: string;
    keyConcepts: { description: string; details: string }[];
    notes?: string | string[];
    formulas?: string[];
    derivations?: string | string[];
    pyqs?: {
        questionText: string;
        answer?: string;
        answerExplanation?: string;
        year?: number;
        source?: string;
    }[];
}) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to download the study material');
        return;
    }

    const notesText = Array.isArray(data.notes) ? data.notes.join('\n\n') : (data.notes || '');
    const derivationText = data.derivations 
        ? (Array.isArray(data.derivations) ? data.derivations.join('\n\n') : data.derivations)
        : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - Study Material</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Kannada:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Kannada', 'Noto Sans Tamil', 'Noto Sans Telugu', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header .meta {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            color: #3b82f6;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 3px solid #3b82f6;
        }
        
        .content {
            font-size: 14px;
            white-space: pre-wrap;
            line-height: 1.8;
        }
        
        .concepts-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .concepts-table th {
            background: #3b82f6;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        
        .concepts-table td {
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
        }
        
        .concepts-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .pyq-item {
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            page-break-inside: avoid;
        }
        
        .pyq-question {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 15px;
        }
        
        .pyq-header {
            color: #3b82f6;
            font-weight: 700;
            font-size: 16px;
            margin-bottom: 8px;
        }
        
        .pyq-answer {
            background: #ecfdf5;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
        }
        
        .pyq-explanation {
            background: #fef3c7;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
        }
        
        .label {
            font-weight: 700;
            color: #059669;
            display: block;
            margin-bottom: 5px;
        }
        
        .formula-item {
            background: #f0f9ff;
            padding: 10px 15px;
            margin: 8px 0;
            border-radius: 5px;
            border-left: 3px solid #0ea5e9;
        }
        
        @media print {
            body {
                padding: 10mm;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .header {
                page-break-after: avoid;
            }
        }
        
        @page {
            margin: 15mm;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.title}</h1>
        <div class="meta">
            <span>Subject: ${data.subject}</span>
            <span>Level: Class ${data.gradeLevel}</span>
        </div>
    </div>
    
    <div class="section">
        <h2 class="section-title">📖 Topic Overview</h2>
        <div class="content">${data.scenarioDescription}</div>
    </div>
    
    <div class="section">
        <h2 class="section-title">🎯 Key Concepts</h2>
        <table class="concepts-table">
            <thead>
                <tr>
                    <th style="width: 50px">#</th>
                    <th style="width: 35%">Concept</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${data.keyConcepts.map((c, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td><strong>${c.description}</strong></td>
                        <td>${c.details}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    ${notesText ? `
    <div class="section">
        <h2 class="section-title">📝 Comprehensive Notes</h2>
        <div class="content">${notesText}</div>
    </div>
    ` : ''}
    
    ${(data.formulas && data.formulas.length > 0) || derivationText ? `
    <div class="section">
        <h2 class="section-title">🔢 Formulas & Derivations</h2>
        ${data.formulas && data.formulas.length > 0 ? `
            ${data.formulas.map(f => `<div class="formula-item">${f}</div>`).join('')}
        ` : ''}
        ${derivationText ? `<div class="content" style="margin-top: 15px">${derivationText}</div>` : ''}
    </div>
    ` : ''}
    
    ${data.pyqs && data.pyqs.length > 0 ? `
    <div class="section" style="page-break-before: always">
        <h2 class="section-title">✍️ Practice Questions (PYQs & AI Generated)</h2>
        ${data.pyqs.map((q, i) => `
            <div class="pyq-item">
                <div class="pyq-header">
                    Q${i + 1}: ${q.year ? `(${q.year})` : ''} ${q.source === 'pyq' ? '[PYQ]' : '[AI Generated]'}
                </div>
                <div class="pyq-question">${q.questionText}</div>
                ${q.answer ? `
                    <div class="pyq-answer">
                        <span class="label">Answer:</span>
                        ${q.answer}
                    </div>
                ` : ''}
                ${q.answerExplanation ? `
                    <div class="pyq-explanation">
                        <span class="label">Explanation:</span>
                        ${q.answerExplanation}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        Generated by EdTech Learning Forge • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
            }, 500);
        };
    </script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};

export const exportLeaderboardToPDF = (
    leaderboard: { name: string; score: number; puzzleScore?: number }[],
    topic: string,
    roomId: string
) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Study Room Leaderboard', 105, 20, { align: 'center' });

    // Add room info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Topic: ${topic}`, 20, 35);
    doc.text(`Room ID: ${roomId}`, 20, 42);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 49);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 20, 56);

    // Add leaderboard table
    const tableData = leaderboard.map((entry, index) => {
        const puzzleScore = entry.puzzleScore || 0;
        const totalScore = entry.score + puzzleScore;
        return [
            index + 1,
            entry.name,
            entry.score,
            puzzleScore,
            totalScore,
            index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
        ];
    });

    autoTable(doc, {
        startY: 65,
        head: [['Rank', 'Name', 'Quiz', 'Puzzle', 'Total', 'Medal']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [59, 130, 246], // Blue
            fontSize: 12,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 11,
            cellPadding: 5
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { cellWidth: 60 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 25 },
            4: { halign: 'center', cellWidth: 25 },
            5: { halign: 'center', cellWidth: 25 }
        }
    });

    // Add footer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(
        `Generated by EdTech Study Room - Page ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
    );

    // Save the PDF
    const fileName = `Leaderboard_${roomId}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
};

export const exportStudyMaterialToPDF = (
    data: {
        title: string;
        subject: string;
        gradeLevel: number | string;
        scenarioDescription: string;
        keyConcepts: { description: string; details: string }[];
        notes?: string | string[];
        formulas?: string[];
        derivations?: string | string[];
        pyqs?: {
            questionText: string;
            answer?: string;
            answerExplanation?: string;
            year?: number;
            source?: string;
        }[];
    }
) => {
    // For Unicode support (Indian languages), we'll create an HTML document and trigger print
    // This preserves all Unicode characters properly
    const hasUnicodeContent = () => {
        const checkText = (text: string) => {
            // Check if text contains non-ASCII characters (Unicode)
            return /[^\x00-\x7F]/.test(text);
        };
        
        if (checkText(data.title) || checkText(data.subject) || checkText(data.scenarioDescription)) {
            return true;
        }
        
        if (data.notes) {
            const notesText = Array.isArray(data.notes) ? data.notes.join('') : data.notes;
            if (checkText(notesText)) return true;
        }
        
        return false;
    };

    // If content has Unicode (Indian languages), use HTML print method
    if (hasUnicodeContent()) {
        exportAsHTMLPrint(data);
        return;
    }

    // For English-only content, use jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Helper to add a header
    const addSectionHeader = (text: string) => {
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246); // Blue primary color
        doc.text(text, 20, currentY);
        currentY += 10;
        doc.setTextColor(0, 0, 0); // Reset to black
    };

    // Helper to add wrapped text
    const addText = (text: string, fontSize = 11, fontStyle = 'normal') => {
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, pageWidth - 40);

        if (currentY + (lines.length * (fontSize / 2)) > 280) {
            doc.addPage();
            currentY = 20;
        }

        doc.text(lines, 20, currentY);
        currentY += (lines.length * (fontSize / 2)) + 5;
    };

    // Cover Section
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(data.title, pageWidth / 2, 25, { align: 'center' });

    currentY = 55;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subject: ${data.subject}`, 20, currentY);
    doc.text(`Level: Class ${data.gradeLevel}`, pageWidth - 20, currentY, { align: 'right' });
    currentY += 15;

    // 1. Overview
    addSectionHeader('Topic Overview');
    addText(data.scenarioDescription);

    // 2. Key Concepts
    addSectionHeader('Key Concepts');
    const conceptData = data.keyConcepts.map((c, i) => [i + 1, c.description, c.details]);
    autoTable(doc, {
        startY: currentY,
        head: [['#', 'Concept', 'Details']],
        body: conceptData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 50 } },
        didDrawPage: (d) => { currentY = d.cursor ? d.cursor.y + 15 : currentY; }
    });

    // 3. Notes
    if (data.notes) {
        addSectionHeader('Comprehensive Notes');
        const notesText = Array.isArray(data.notes)
            ? data.notes.join('\n')
            : data.notes;
        addText(notesText.replace(/\\n/g, '\n'));
    }

    // 4. Formulas & Derivations
    if ((data.formulas && data.formulas.length > 0) || data.derivations) {
        addSectionHeader('Formulas & Derivations');
        if (data.formulas && data.formulas.length > 0) {
            data.formulas.forEach(f => {
                addText(`• ${f}`, 11, 'normal');
            });
        }
        if (data.derivations) {
            const derivationText = Array.isArray(data.derivations)
                ? data.derivations.join('\n')
                : data.derivations;
            addText(derivationText.replace(/\\n/g, '\n'));
        }
    }

    // 5. Practice Questions (PYQs)
    if (data.pyqs && data.pyqs.length > 0) {
        doc.addPage();
        currentY = 20;
        addSectionHeader('Practice Questions (PYQs & AI Generated)');

        data.pyqs.forEach((q, i) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            const qHeader = `Q${i + 1}: ${q.year ? `(${q.year})` : ''} ${q.source === 'pyq' ? '[PYQ]' : '[AI]'}`;
            doc.text(qHeader, 20, currentY);
            currentY += 8;

            addText(q.questionText, 11, 'italic');

            if (q.answer) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('Correct Answer:', 20, currentY);
                currentY += 5;
                addText(q.answer, 10);
            }

            if (q.answerExplanation) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('Explanation:', 20, currentY);
                currentY += 5;
                addText(q.answerExplanation, 10);
            }

            currentY += 5;
            doc.setDrawColor(200, 200, 200);
            doc.line(20, currentY, pageWidth - 20, currentY);
            currentY += 10;
        });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated by EdTech Learning Forge • Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    // Save
    const fileName = `${data.title.replace(/\s+/g, '_')}_Study_Material.pdf`;
    doc.save(fileName);
};


