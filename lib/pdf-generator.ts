import type { SalaryRecord, Employee, CompanySettings } from '@/types'
import { MONTHS } from '@/lib/utils'

export async function generateSalarySlipPDF(
  record: SalaryRecord,
  employee: Employee,
  settings: CompanySettings
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const sym = settings.currencySymbol ?? '₹'
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
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const sym = settings.currencySymbol ?? '₹'
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFillColor(124, 58, 237)
  doc.rect(0, 0, pageW, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`${settings.name} — Payroll Report`, 14, 13)
  doc.setFontSize(10)
  doc.text(`${MONTHS[month - 1]} ${year}`, pageW - 14, 13, { align: 'right' })

  doc.setTextColor(15, 23, 42)

  autoTable(doc, {
    startY: 26,
    head: [['Employee', 'Branch', 'Base Salary', 'Present', 'Absent', 'Leave Ded.', 'Advance', 'Bonus', 'Net Salary', 'Status']],
    body: records.map(r => [
      r.employeeName,
      r.branch,
      `${sym}${r.baseSalary.toFixed(2)}`,
      r.presentDays,
      r.absentDays,
      `${sym}${r.leaveDeduction.toFixed(2)}`,
      `${sym}${r.advanceDeduction.toFixed(2)}`,
      `${sym}${r.bonus.toFixed(2)}`,
      `${sym}${r.finalSalary.toFixed(2)}`,
      r.paid ? 'PAID' : 'PENDING',
    ]),
    foot: [[
      'TOTAL', '', `${sym}${records.reduce((s, r) => s + r.baseSalary, 0).toFixed(2)}`,
      '', '', '', '', '',
      `${sym}${records.reduce((s, r) => s + r.finalSalary, 0).toFixed(2)}`, '',
    ]],
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold', fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: { 9: { halign: 'center' } },
  })

  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text('Generated by SEP Salary Shop', pageW / 2, 200, { align: 'center' })

  doc.save(`payroll-report-${MONTHS[month - 1]}-${year}.pdf`)
}
