import type { SalaryRecord, Employee, CompanySettings } from '@/types'
import { MONTHS } from '@/lib/utils'

/** jsPDF's default Helvetica font doesn't support ₹ — use Rs. instead */
function pdfSym(symbol: string): string {
  return symbol === '₹' ? 'Rs.' : symbol
}

export async function generateSalarySlipPDF(
  record: SalaryRecord,
  employee: Employee,
  settings: CompanySettings
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const sym = pdfSym(settings.currencySymbol ?? '₹')
  const pageW = doc.internal.pageSize.getWidth()

  // Header background
  doc.setFillColor(124, 58, 237)
  doc.rect(0, 0, pageW, 38, 'F')

  // Company logo
  if (settings.logoBase64) {
    try {
      doc.addImage(settings.logoBase64, 'PNG', 10, 5, 20, 20)
    } catch { /* skip */ }
  }

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.name || 'SEP Salary Shop', settings.logoBase64 ? 35 : 14, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (settings.address) doc.text(settings.address, settings.logoBase64 ? 35 : 14, 23)
  if (settings.phone || settings.email) {
    doc.text(`${settings.phone ?? ''} ${settings.email ?? ''}`.trim(), settings.logoBase64 ? 35 : 14, 29)
  }

  // Salary Slip title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SALARY SLIP', pageW - 14, 16, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${MONTHS[record.month - 1]} ${record.year}`, pageW - 14, 23, { align: 'right' })

  // Reset text color
  doc.setTextColor(15, 23, 42)

  // Employee info box
  doc.setFontSize(9)
  doc.setFillColor(243, 244, 246)
  doc.rect(10, 44, pageW - 20, 28, 'F')
  doc.setDrawColor(229, 231, 235)
  doc.rect(10, 44, pageW - 20, 28)

  const col1 = 14
  const col2 = pageW / 2 + 4

  doc.setFont('helvetica', 'bold')
  doc.text('Employee ID:', col1, 52)
  doc.setFont('helvetica', 'normal')
  doc.text(employee.employeeId, col1 + 30, 52)

  doc.setFont('helvetica', 'bold')
  doc.text('Name:', col1, 59)
  doc.setFont('helvetica', 'normal')
  doc.text(employee.name, col1 + 30, 59)

  doc.setFont('helvetica', 'bold')
  doc.text('Branch:', col1, 66)
  doc.setFont('helvetica', 'normal')
  doc.text(record.branch, col1 + 30, 66)

  doc.setFont('helvetica', 'bold')
  doc.text('Mobile:', col2, 52)
  doc.setFont('helvetica', 'normal')
  doc.text(employee.mobile, col2 + 25, 52)

  doc.setFont('helvetica', 'bold')
  doc.text('Joining Date:', col2, 59)
  doc.setFont('helvetica', 'normal')
  doc.text(employee.joiningDate, col2 + 30, 59)

  doc.setFont('helvetica', 'bold')
  doc.text('Bank Account:', col2, 66)
  doc.setFont('helvetica', 'normal')
  doc.text(employee.bankAccount ?? '—', col2 + 32, 66)

  // Earnings & Deductions
  const half = (pageW - 20) / 2

  autoTable(doc, {
    startY: 78,
    margin: { left: 10, right: pageW / 2 + 2 },
    head: [['Earnings', `Amount (${sym})`]],
    body: [
      ['Basic Salary', record.baseSalary.toFixed(2)],
      ['Bonus', record.bonus.toFixed(2)],
      ['Overtime', (record.overtimeDays * (record.baseSalary / 30)).toFixed(2)],
    ],
    foot: [['TOTAL EARNINGS', (record.baseSalary + record.bonus).toFixed(2)]],
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [243, 244, 246], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    tableWidth: half - 2,
  })

  const leftFinalY = (doc as any).lastAutoTable.finalY

  autoTable(doc, {
    startY: 78,
    margin: { left: pageW / 2 + 2, right: 10 },
    head: [['Deductions', `Amount (${sym})`]],
    body: [
      ['Leave Deduction', record.leaveDeduction.toFixed(2)],
      ['Advance', record.advanceDeduction.toFixed(2)],
      ['Late Deduction', record.lateDeduction.toFixed(2)],
      ['Other Deductions', record.otherDeductions.toFixed(2)],
    ],
    foot: [['TOTAL DEDUCTIONS', (record.leaveDeduction + record.advanceDeduction + record.lateDeduction + record.otherDeductions).toFixed(2)]],
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [243, 244, 246], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    tableWidth: half - 2,
  })

  const finalY = Math.max(leftFinalY, (doc as any).lastAutoTable.finalY) + 6

  // Net salary box
  doc.setFillColor(124, 58, 237)
  doc.rect(10, finalY, pageW - 20, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('NET SALARY:', 14, finalY + 9)
  doc.text(`${sym}${record.finalSalary.toFixed(2)}`, pageW - 14, finalY + 9, { align: 'right' })

  // Payment status
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const status = record.paid ? `PAID on ${record.paidDate ? new Date(record.paidDate).toLocaleDateString('en-IN') : ''}` : 'PENDING'
  doc.text(`Status: ${status}`, 14, finalY + 22)

  // Signature lines
  const sigY = finalY + 40
  doc.setDrawColor(180, 180, 180)
  doc.line(14, sigY, 70, sigY)
  doc.line(pageW - 70, sigY, pageW - 14, sigY)
  doc.setFontSize(8)
  doc.text("Employee Signature", 14, sigY + 5)
  doc.text("Employer Signature", pageW - 14, sigY + 5, { align: 'right' })

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text('Generated by SEP Salary Shop', pageW / 2, 285, { align: 'center' })

  doc.save(`salary-slip-${employee.name.replace(/\s+/g, '-')}-${MONTHS[record.month - 1]}-${record.year}.pdf`)
}

export async function generatePayrollReportPDF(
  records: SalaryRecord[],
  month: number,
  year: number,
  settings: CompanySettings
) {
  const { default: jsPDF } = await import('jspdf')

  const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const sym       = pdfSym(settings.currencySymbol ?? '₹')
  const pageW     = doc.internal.pageSize.getWidth()   // 210
  const pageH     = doc.internal.pageSize.getHeight()  // 297
  const margin    = 12
  const PER_PAGE  = 5   // cards per page
  const CARD_H    = 46  // height of each card in mm
  const CARD_GAP  = 4
  const HEADER_H  = 28  // top header height

  const totalPages = Math.ceil(records.length / PER_PAGE)

  // helper: draw page header
  const drawHeader = (pageNum: number) => {
    // Purple header bar
    doc.setFillColor(124, 58, 237)
    doc.rect(0, 0, pageW, HEADER_H, 'F')

    // Company logo
    if (settings.logoBase64) {
      try { doc.addImage(settings.logoBase64, 'PNG', margin, 5, 14, 14) } catch { /* skip */ }
    }
    const textX = settings.logoBase64 ? margin + 17 : margin

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(settings.name || 'SEP Salary Shop', textX, 13)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Payroll Report — ${MONTHS[month - 1]} ${year}`, textX, 20)

    // Page number (right)
    doc.setFontSize(8)
    doc.text(`Page ${pageNum} of ${totalPages}`, pageW - margin, 13, { align: 'right' })
    doc.setFontSize(7)
    doc.text(`Total Employees: ${records.length}`, pageW - margin, 20, { align: 'right' })

    // Reset text colour
    doc.setTextColor(15, 23, 42)
  }

  // helper: draw one employee card
  const drawCard = (r: SalaryRecord, y: number) => {
    const cardX = margin
    const cardW = pageW - margin * 2

    // Card background
    doc.setFillColor(248, 250, 252)   // slate-50
    doc.setDrawColor(226, 232, 240)   // border
    doc.roundedRect(cardX, y, cardW, CARD_H, 3, 3, 'FD')

    // Left accent stripe (purple for paid, amber for pending)
    if (r.paid) {
      doc.setFillColor(124, 58, 237)
    } else {
      doc.setFillColor(245, 158, 11)
    }
    doc.roundedRect(cardX, y, 4, CARD_H, 2, 2, 'F')
    doc.rect(cardX + 2, y, 2, CARD_H, 'F')  // fill right half of rounded rect edge

    // Employee name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(r.employeeName, cardX + 9, y + 9)

    // Branch tag
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)   // slate-500
    doc.text(`${r.branch}  ·  ${MONTHS[r.month - 1]} ${r.year}`, cardX + 9, y + 15)

    // Status pill
    const statusText = r.paid ? 'PAID' : 'PENDING'
    if (r.paid) {
      doc.setFillColor(220, 252, 231)
      doc.setTextColor(22, 101, 52)
    } else {
      doc.setFillColor(254, 243, 199)
      doc.setTextColor(146, 64, 14)
    }
    doc.roundedRect(cardX + cardW - 28, y + 5, 20, 7, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.text(statusText, cardX + cardW - 18, y + 10, { align: 'center' })

    // Divider line
    doc.setDrawColor(226, 232, 240)
    doc.line(cardX + 9, y + 18, cardX + cardW - 6, y + 18)

    // Salary fields grid (2 rows × 5 cols)
    const fields = [
      { label: 'Base Salary',   value: `${sym}${r.baseSalary.toFixed(2)}`,      color: [15, 23, 42] as [number,number,number] },
      { label: 'Present Days',  value: String(r.presentDays),                   color: [21, 128, 61] as [number,number,number] },
      { label: 'Absent Days',   value: String(r.absentDays),                    color: [185, 28, 28] as [number,number,number] },
      { label: 'Leave Ded.',    value: `${sym}${r.leaveDeduction.toFixed(2)}`,  color: [185, 28, 28] as [number,number,number] },
      { label: 'Advance (−)',   value: `${sym}${r.advanceDeduction.toFixed(2)}`,color: [185, 28, 28] as [number,number,number] },
      { label: 'Bonus (+)',     value: `${sym}${r.bonus.toFixed(2)}`,           color: [21, 128, 61] as [number,number,number] },
      { label: 'Other Ded.',    value: `${sym}${r.otherDeductions.toFixed(2)}`, color: [185, 28, 28] as [number,number,number] },
    ]

    const colCount  = 4
    const fieldW    = (cardW - 18) / colCount
    const rowStartX = cardX + 9
    const row1Y     = y + 23
    const row2Y     = y + 34

    fields.slice(0, colCount).forEach((f, i) => {
      const fx = rowStartX + i * fieldW
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(100, 116, 139)
      doc.text(f.label, fx, row1Y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...f.color)
      doc.text(f.value, fx, row1Y + 5)
    })

    fields.slice(colCount, colCount + 3).forEach((f, i) => {
      const fx = rowStartX + i * fieldW
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(100, 116, 139)
      doc.text(f.label, fx, row2Y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...f.color)
      doc.text(f.value, fx, row2Y + 5)
    })

    // Net salary — right side highlight box
    const netX = cardX + cardW - 46
    const netY = y + 20
    doc.setFillColor(124, 58, 237)
    doc.roundedRect(netX, netY, 40, 20, 2, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(216, 180, 254)   // purple-300
    doc.text('NET SALARY', netX + 20, netY + 7, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`${sym}${r.finalSalary.toFixed(2)}`, netX + 20, netY + 15, { align: 'center' })
  }

  // ── Render pages ─────────────────────────────────────────────────────────────
  const totalNetSalary = records.reduce((s, r) => s + r.finalSalary, 0)
  const paidCount      = records.filter(r => r.paid).length

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) doc.addPage()
    drawHeader(pageIdx + 1)

    const pageRecords = records.slice(pageIdx * PER_PAGE, (pageIdx + 1) * PER_PAGE)

    pageRecords.forEach((r, i) => {
      const cardY = HEADER_H + 6 + i * (CARD_H + CARD_GAP)
      drawCard(r, cardY)
    })

    // Footer on last page: summary bar
    if (pageIdx === totalPages - 1) {
      const footerY = pageH - 18
      doc.setFillColor(30, 27, 75)   // indigo-950
      doc.rect(0, footerY, pageW, 18, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text(`Total Employees: ${records.length}  ·  Paid: ${paidCount}  ·  Pending: ${records.length - paidCount}`, margin, footerY + 7)
      doc.setFontSize(9)
      doc.text(`Total Net Salary: ${sym}${totalNetSalary.toFixed(2)}`, pageW - margin, footerY + 7, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(148, 163, 184)  // slate-400
      doc.text('Generated by SEP Salary Shop', pageW / 2, footerY + 14, { align: 'center' })
    }
  }

  doc.save(`payroll-report-${MONTHS[month - 1]}-${year}.pdf`)
}
