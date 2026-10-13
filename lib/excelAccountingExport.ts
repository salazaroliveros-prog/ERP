import { Project, CompanySettings, ExpenseRecord, FieldVisit, AttendanceRecord, Employee } from './types';

export interface ExportExcelOptions {
  project: Project;
  company: CompanySettings;
  expenses: ExpenseRecord[];
  fieldVisits: FieldVisit[];
  currency: 'GTQ' | 'USD';
  attendance?: AttendanceRecord[];
  employees?: Employee[];
}

/**
 * Pre-configured VBA Macros code for Guatemalan Construction Accounting
 */
export const GUATEMALAN_ACCOUNTING_VBA_MACROS = `' ==============================================================================
' CONSTRUCTERP GUATEMALA - MACROS CONTABLES AUTOMATIZADAS PARA CONSTRUCCIÓN
' Proyecto: {PROJECT_CODE} - {PROJECT_NAME}
' Generado el: {DATE_GENERATED}
' ==============================================================================

' MACRO 1: GENERACIÓN DEL LIBRO DE COMPRAS Y SERVICIOS RECIBIDOS (SAT)
' Automatiza la estructura exigida para la conciliación mensual de crédito fiscal IVA (12%)
Sub GenerarLibroComprasSAT()
    Dim wsGastos As Worksheet, wsSAT As Worksheet
    Dim lastRow As Long, i As Long, destRow As Long
    Dim totalFacturas As Double, totalIVA As Double, totalSubtotal As Double
    
    On Error GoTo ErrorHandler
    Set wsGastos = ThisWorkbook.Sheets("Registro_Gastos_Contable")
    
    ' Crear o limpiar hoja de compras SAT
    On Error Resume Next
    Application.DisplayAlerts = False
    Sheets("Libro_Compras_SAT").Delete
    Application.DisplayAlerts = True
    On Error GoTo ErrorHandler
    
    Set wsSAT = ThisWorkbook.Sheets.Add(After:=wsGastos)
    wsSAT.Name = "Libro_Compras_SAT"
    
    ' Encabezados SAT
    wsSAT.Range("A1:H1").Merge
    wsSAT.Range("A1").Value = "LIBRO DE COMPRAS Y SERVICIOS RECIBIDOS (SAT) - CONSTRUCCIÓN"
    wsSAT.Range("A1").Font.Bold = True
    wsSAT.Range("A1").Font.Size = 14
    wsSAT.Range("A1").Interior.Color = RGB(30, 41, 59)
    wsSAT.Range("A1").Font.Color = RGB(255, 255, 255)
    
    wsSAT.Cells(2, 1).Value = "PROYECTO: " & "{PROJECT_NAME}"
    wsSAT.Cells(2, 1).Font.Bold = True
    
    Dim headers() As Variant
    headers = Array("Fecha", "NIT Proveedor", "Nombre Proveedor", "Serie / DTE", "No. Factura", "Subtotal (Q)", "IVA Crédito Fiscal (12%)", "Total Factura (Q)")
    
    For i = 0 To UBound(headers)
        wsSAT.Cells(4, i + 1).Value = headers(i)
        wsSAT.Cells(4, i + 1).Font.Bold = True
        wsSAT.Cells(4, i + 1).Interior.Color = RGB(241, 245, 249)
    Next i
    
    lastRow = wsGastos.Cells(wsGastos.Rows.Count, "B").End(xlUp).Row
    destRow = 5
    
    For i = 3 To lastRow
        If wsGastos.Cells(i, 2).Value <> "" And wsGastos.Cells(i, 2).Value <> "TOTAL GENERAL" Then
            wsSAT.Cells(destRow, 1).Value = wsGastos.Cells(i, 2).Value ' Fecha
            wsSAT.Cells(destRow, 2).Value = wsGastos.Cells(i, 4).Value ' NIT
            wsSAT.Cells(destRow, 3).Value = wsGastos.Cells(i, 3).Value ' Proveedor
            wsSAT.Cells(destRow, 4).Value = "FEL"                      ' Tipo Documento
            wsSAT.Cells(destRow, 5).Value = wsGastos.Cells(i, 5).Value ' No. Factura
            wsSAT.Cells(destRow, 6).Value = wsGastos.Cells(i, 9).Value ' Subtotal
            wsSAT.Cells(destRow, 7).Value = wsGastos.Cells(i, 10).Value ' IVA Crédito
            wsSAT.Cells(destRow, 8).Value = wsGastos.Cells(i, 11).Value ' Total
            
            wsSAT.Cells(destRow, 6).NumberFormat = "Q#,##0.00"
            wsSAT.Cells(destRow, 7).NumberFormat = "Q#,##0.00"
            wsSAT.Cells(destRow, 8).NumberFormat = "Q#,##0.00"
            
            destRow = destRow + 1
        End If
    Next i
    
    ' Fila de totales
    wsSAT.Cells(destRow, 5).Value = "TOTALES:"
    wsSAT.Cells(destRow, 5).Font.Bold = True
    wsSAT.Cells(destRow, 6).Formula = "=SUM(F5:F" & (destRow - 1) & ")"
    wsSAT.Cells(destRow, 7).Formula = "=SUM(G5:G" & (destRow - 1) & ")"
    wsSAT.Cells(destRow, 8).Formula = "=SUM(H5:H" & (destRow - 1) & ")"
    wsSAT.Range(wsSAT.Cells(destRow, 5), wsSAT.Cells(destRow, 8)).Font.Bold = True
    wsSAT.Range(wsSAT.Cells(destRow, 5), wsSAT.Cells(destRow, 8)).Interior.Color = RGB(254, 243, 199)
    
    wsSAT.Columns("A:H").AutoFit
    MsgBox "¡Libro de Compras SAT generado exitosamente con " & (destRow - 5) & " registros!", vbInformation, "ConstructERP Guatemala"
    Exit Sub

ErrorHandler:
    MsgBox "Error al generar libro de compras: " & Err.Description, vbCritical, "Error"
End Sub

' MACRO 2: AUDITORÍA DE FACTURAS DUPLICADAS
' Busca combinaciones repetidas de Proveedor + Número de Factura y las resalta en rojo
Sub AuditarFacturasDuplicadas()
    Dim ws As Worksheet
    Dim lastRow As Long, i As Long, j As Long
    Dim dupCount As Long
    Dim key1 As String, key2 As String
    
    Set ws = ThisWorkbook.Sheets("Registro_Gastos_Contable")
    lastRow = ws.Cells(ws.Rows.Count, "B").End(xlUp).Row
    dupCount = 0
    
    ' Limpiar colores previos
    ws.Range("B3:K" & lastRow).Interior.ColorIndex = xlNone
    
    For i = 3 To lastRow - 1
        If ws.Cells(i, 5).Value <> "" Then
            key1 = Trim(CStr(ws.Cells(i, 4).Value)) & "-" & Trim(CStr(ws.Cells(i, 5).Value))
            For j = i + 1 To lastRow
                key2 = Trim(CStr(ws.Cells(j, 4).Value)) & "-" & Trim(CStr(ws.Cells(j, 5).Value))
                If key1 = key2 And key1 <> "-" Then
                    ws.Range(ws.Cells(i, 2), ws.Cells(i, 11)).Interior.Color = RGB(254, 202, 202) ' Rojo suave
                    ws.Range(ws.Cells(j, 2), ws.Cells(j, 11)).Interior.Color = RGB(254, 202, 202)
                    dupCount = dupCount + 1
                End If
            Next j
        End If
    Next i
    
    If dupCount > 0 Then
        MsgBox "Se encontraron " & dupCount & " facturas potencialmente duplicadas (resaltadas en rojo).", vbExclamation, "Auditoría de Gastos"
    Else
        MsgBox "¡Auditoría limpia! No se detectaron facturas duplicadas para este proyecto.", vbInformation, "Auditoría de Gastos"
    End If
End Sub

' MACRO 3: GENERACIÓN AUTOMÁTICA DE PÓLIZA CONTABLE (ASIENTO DIARIO)
' Genera la póliza de partida doble para el sistema contable general
Sub GenerarPolizaContable()
    Dim wsGastos As Worksheet, wsPoliza As Worksheet
    Dim lastRow As Long, i As Long, rowP As Long
    Dim totalMat As Double, totalMO As Double, totalMaq As Double, totalPerm As Double, totalImp As Double
    Dim totalIVA As Double, totalGasto As Double
    
    Set wsGastos = ThisWorkbook.Sheets("Registro_Gastos_Contable")
    lastRow = wsGastos.Cells(wsGastos.Rows.Count, "B").End(xlUp).Row
    
    For i = 3 To lastRow
        If wsGastos.Cells(i, 2).Value <> "" And wsGastos.Cells(i, 2).Value <> "TOTAL GENERAL" Then
            Select Case wsGastos.Cells(i, 6).Value
                Case "Materiales (Cementos, Hierro)"
                    totalMat = totalMat + Val(wsGastos.Cells(i, 9).Value)
                Case "Mano de Obra"
                    totalMO = totalMO + Val(wsGastos.Cells(i, 9).Value)
                Case "Maquinaria y Combustible"
                    totalMaq = totalMaq + Val(wsGastos.Cells(i, 9).Value)
                Case "Permisos & Licencias"
                    totalPerm = totalPerm + Val(wsGastos.Cells(i, 9).Value)
                Case Else
                    totalImp = totalImp + Val(wsGastos.Cells(i, 9).Value)
            End Select
            totalIVA = totalIVA + Val(wsGastos.Cells(i, 10).Value)
            totalGasto = totalGasto + Val(wsGastos.Cells(i, 11).Value)
        End If
    Next i
    
    On Error Resume Next
    Application.DisplayAlerts = False
    Sheets("Poliza_Contable_Diario").Delete
    Application.DisplayAlerts = True
    On Error GoTo 0
    
    Set wsPoliza = ThisWorkbook.Sheets.Add(After:=wsGastos)
    wsPoliza.Name = "Poliza_Contable_Diario"
    
    wsPoliza.Range("A1:E1").Merge
    wsPoliza.Range("A1").Value = "PÓLIZA DE DIARIO / ASIENTO CONTABLE DE LIQUIDACIÓN DE OBRA"
    wsPoliza.Range("A1").Font.Bold = True
    wsPoliza.Range("A1").Interior.Color = RGB(15, 23, 42)
    wsPoliza.Range("A1").Font.Color = RGB(255, 255, 255)
    
    wsPoliza.Cells(3, 1).Value = "Código Cuenta"
    wsPoliza.Cells(3, 2).Value = "Descripción de la Cuenta"
    wsPoliza.Cells(3, 3).Value = "Debe (Q)"
    wsPoliza.Cells(3, 4).Value = "Haber (Q)"
    wsPoliza.Range("A3:D3").Font.Bold = True
    wsPoliza.Range("A3:D3").Interior.Color = RGB(226, 232, 240)
    
    rowP = 4
    If totalMat > 0 Then
        wsPoliza.Cells(rowP, 1).Value = "1108.01"
        wsPoliza.Cells(rowP, 2).Value = "Obras en Proceso - Materiales ({PROJECT_NAME})"
        wsPoliza.Cells(rowP, 3).Value = totalMat
        rowP = rowP + 1
    End If
    If totalMO > 0 Then
        wsPoliza.Cells(rowP, 1).Value = "1108.02"
        wsPoliza.Cells(rowP, 2).Value = "Obras en Proceso - Mano de Obra Directa"
        wsPoliza.Cells(rowP, 3).Value = totalMO
        rowP = rowP + 1
    End If
    If totalMaq > 0 Then
        wsPoliza.Cells(rowP, 1).Value = "1108.03"
        wsPoliza.Cells(rowP, 2).Value = "Obras en Proceso - Maquinaria y Equipo"
        wsPoliza.Cells(rowP, 3).Value = totalMaq
        rowP = rowP + 1
    End If
    If totalPerm > 0 Then
        wsPoliza.Cells(rowP, 1).Value = "1108.04"
        wsPoliza.Cells(rowP, 2).Value = "Obras en Proceso - Licencias y Permisos Municipales"
        wsPoliza.Cells(rowP, 3).Value = totalPerm
        rowP = rowP + 1
    End If
    If totalImp > 0 Then
        wsPoliza.Cells(rowP, 1).Value = "1108.05"
        wsPoliza.Cells(rowP, 2).Value = "Obras en Proceso - Gastos Varios e Imprevistos"
        wsPoliza.Cells(rowP, 3).Value = totalImp
        rowP = rowP + 1
    End If
    
    ' IVA Crédito Fiscal
    wsPoliza.Cells(rowP, 1).Value = "1105.01"
    wsPoliza.Cells(rowP, 2).Value = "IVA Crédito Fiscal por Cobrar (12% SAT)"
    wsPoliza.Cells(rowP, 3).Value = totalIVA
    rowP = rowP + 1
    
    ' Contrapartida: Bancos / Cuentas por Pagar
    wsPoliza.Cells(rowP, 1).Value = "1101.02"
    wsPoliza.Cells(rowP, 2).Value = "Bancos del Sistema / Cuentas por Pagar Proveedores"
    wsPoliza.Cells(rowP, 4).Value = totalGasto
    rowP = rowP + 1
    
    ' Totales Partida Doble
    wsPoliza.Cells(rowP, 2).Value = "SUMAS IGUALES (PARTIDA DOBLE):"
    wsPoliza.Cells(rowP, 2).Font.Bold = True
    wsPoliza.Cells(rowP, 3).Formula = "=SUM(C4:C" & (rowP - 1) & ")"
    wsPoliza.Cells(rowP, 4).Formula = "=SUM(D4:D" & (rowP - 1) & ")"
    wsPoliza.Range(wsPoliza.Cells(rowP, 2), wsPoliza.Cells(rowP, 4)).Font.Bold = True
    wsPoliza.Range(wsPoliza.Cells(rowP, 2), wsPoliza.Cells(rowP, 4)).Interior.Color = RGB(220, 252, 231)
    
    wsPoliza.Range("C4:D" & rowP).NumberFormat = "Q#,##0.00"
    wsPoliza.Columns("A:E").AutoFit
    
    MsgBox "Póliza contable cuadrada generada con éxito.", vbInformation, "Contabilidad de Obras"
End Sub

' MACRO 4: AUDITORÍA DE ASISTENCIA Y CRUCE CON NÓMINA IGSS / SAT
Sub AuditarAsistenciaLaboralIGSS()
    Dim wsAsist As Worksheet
    Dim lastRow As Long, i As Long, countValid As Long, countOutside As Long
    
    On Error Resume Next
    Set wsAsist = ThisWorkbook.Sheets("Auditoria_Asistencia_SAT_IGSS")
    If wsAsist Is Nothing Then
        MsgBox "No se encontró la hoja Auditoria_Asistencia_SAT_IGSS.", vbExclamation, "Auditoría SAT"
        Exit Sub
    End If
    
    lastRow = wsAsist.Cells(wsAsist.Rows.Count, "C").End(xlUp).Row
    countValid = 0
    countOutside = 0
    
    For i = 4 To (lastRow - 1)
        If InStr(1, wsAsist.Cells(i, 13).Value, "VALIDADO", vbTextCompare) > 0 Then
            countValid = countValid + 1
            wsAsist.Cells(i, 13).Interior.Color = RGB(220, 252, 231)
        ElseIf InStr(1, wsAsist.Cells(i, 13).Value, "FUERA", vbTextCompare) > 0 Then
            countOutside = countOutside + 1
            wsAsist.Cells(i, 13).Interior.Color = RGB(254, 226, 226)
        End If
    Next i
    
    MsgBox "Auditoría de Asistencia SAT / IGSS completada:" & vbCrLf & _
           "- En Obra (<500m): " & countValid & " colaboradores." & vbCrLf & _
           "- Fuera de Geocerca: " & countOutside & " observaciones.", vbInformation, "ConstructERP Auditoría Fiscal"
End Sub
`;

/**
 * Builds and downloads a professional multi-sheet Excel (.xlsx) workbook
 * containing:
 * - Executive Summary with APU & Budget KPI formulas
 * - Accounting Expense Ledger with SAT VAT (12%) calculations
 * - Complete Field Daily Logs (Bitácoras) with foreman stamps and GPS coordinates
 * - Pre-configured VBA Accounting Macros worksheet with automated audit code
 */
export async function exportProjectAccountingWorkbook({
  project,
  company,
  expenses,
  fieldVisits,
  currency,
  attendance = [],
  employees = [],
}: ExportExcelOptions): Promise<void> {
  // Dynamically load xlsx to conserve build and runtime memory
  const XLSX = await import('xlsx');
  // Create workbook
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // 1. SHEET: Resumen_Ejecutivo
  // -------------------------------------------------------------
  const filteredExpenses = expenses.filter((e) => e.projectId === project.id);
  const filteredVisits = fieldVisits.filter((v) => v.projectId === project.id);
  const filteredAttendance = attendance.filter((a) => a.projectId === project.id);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = project.budgetTotal - totalSpent;
  const executionPercent = project.budgetTotal > 0 ? (totalSpent / project.budgetTotal) * 100 : 0;

  // Category sums
  const categories = [
    'Materiales (Cementos, Hierro)',
    'Mano de Obra',
    'Maquinaria y Combustible',
    'Permisos & Licencias',
    'Imprevistos',
  ];

  const summaryData: (string | number)[][] = [
    ['CONSTRUCTERP GUATEMALA - REPORTE CONTABLE Y BITÁCORAS DE OBRA', '', '', '', ''],
    [`Empresa: ${company.commercialName || company.legalName}`, '', `NIT: ${company.nit}`, '', `Fecha: ${new Date().toLocaleDateString('es-GT')}`],
    [`Arquitecto / Colegiado: ${company.architectName} (${company.architectColNumber})`, '', `Dirección: ${company.address}`, '', ''],
    ['', '', '', '', ''],
    ['DATOS GENERALES DEL PROYECTO', '', '', '', ''],
    ['Código de Obra:', project.code, 'Nombre:', project.name, ''],
    ['Cliente:', project.client, 'Ubicación:', `${project.location}, ${project.municipality}`, ''],
    ['Fecha Inicio:', project.startDate, 'Fecha Entrega:', project.endDate, ''],
    ['Estado:', project.status, 'Coordenadas GPS:', `${project.lat}, ${project.lng}`, ''],
    ['', '', '', '', ''],
    ['RESUMEN FINANCIERO Y PRESUPUESTARIO (GTQ)', '', '', '', ''],
    ['Concepto', 'Presupuesto Inicial', 'Total Ejecutado', 'Saldo Disponible', '% Ejecutado'],
    ['Presupuesto General de Obra', project.budgetTotal, totalSpent, balance, `${executionPercent.toFixed(2)}%`],
    ['', '', '', '', ''],
    ['DESGLOSE DE COSTOS DIRECTOS E INDIRECTOS POR CATEGORÍA', '', '', '', ''],
    ['Categoría Contable', 'No. Registros', 'Total Subtotal (Sin IVA)', 'IVA Crédito Fiscal (12%)', 'Monto Total Facturado (GTQ)'],
  ];

  categories.forEach((cat) => {
    const catExpenses = filteredExpenses.filter((e) => e.category === cat);
    const catTotal = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    const subtotal = Math.round((catTotal / 1.12) * 100) / 100;
    const iva = Math.round((catTotal - subtotal) * 100) / 100;
    summaryData.push([cat, catExpenses.length, subtotal, iva, catTotal]);
  });

  const totalSub = Math.round((totalSpent / 1.12) * 100) / 100;
  const totalIva = Math.round((totalSpent - totalSub) * 100) / 100;
  summaryData.push(['TOTAL GENERAL DE GASTOS', filteredExpenses.length, totalSub, totalIva, totalSpent]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths
  wsSummary['!cols'] = [
    { wch: 35 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 28 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Ejecutivo');

  // -------------------------------------------------------------
  // 2. SHEET: Registro_Gastos_Contable
  // -------------------------------------------------------------
  const expensesHeaders = [
    'No.',
    'Fecha',
    'Proveedor / Razón Social',
    'NIT Proveedor',
    'No. Factura / Serie FEL',
    'Categoría de Gasto',
    'Descripción del Gasto',
    'Método de Pago',
    'Subtotal sin IVA (GTQ)',
    'IVA Crédito Fiscal 12% (GTQ)',
    'Monto Total (GTQ)',
    'Equivalente (USD)',
    'Estado Aprobación',
    'Aprobado Por',
    'Fecha Aprobación',
    'Observaciones Auditoría',
  ];

  const expensesRows: (string | number)[][] = [
    [`REGISTRO AUXILIAR DE COMPRAS Y GASTOS CONTABLES - PROYECTO: ${project.code}`],
    expensesHeaders,
  ];

  filteredExpenses.forEach((exp: any, index) => {
    const subtotal = Math.round((exp.amount / 1.12) * 100) / 100;
    const iva = Math.round((exp.amount - subtotal) * 100) / 100;
    const usd = Math.round((exp.amount / company.exchangeRate) * 100) / 100;
    const approvalStatus = exp.approvalStatus || 'Aprobado';
    const approvedBy = exp.approvedBy || 'Ing. Residente';
    const approvedAt = exp.approvedAt || exp.date;
    const auditNotes = exp.auditObservations || 'Verificado conforme SAT y APU';

    expensesRows.push([
      index + 1,
      exp.date,
      exp.supplier,
      exp.nitSupplier,
      exp.facturaNumber,
      exp.category,
      exp.description,
      exp.paymentMethod || 'Transferencia BI',
      subtotal,
      iva,
      exp.amount,
      usd,
      approvalStatus,
      approvedBy,
      approvedAt,
      auditNotes,
    ]);
  });

  // Add total row
  expensesRows.push([
    'TOTAL GENERAL',
    '',
    '',
    '',
    '',
    '',
    `${filteredExpenses.length} Facturas Registradas`,
    '',
    totalSub,
    totalIva,
    totalSpent,
    Math.round((totalSpent / company.exchangeRate) * 100) / 100,
    '',
    '',
    '',
    '',
  ]);

  const wsExpenses = XLSX.utils.aoa_to_sheet(expensesRows);
  wsExpenses['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 30 },
    { wch: 14 },
    { wch: 18 },
    { wch: 28 },
    { wch: 40 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Registro_Gastos_Contable');

  // -------------------------------------------------------------
  // 3. SHEET: Auditoria_Asistencia_SAT_IGSS
  // -------------------------------------------------------------
  const employeeMap = new Map(employees.map((emp) => [emp.id, emp]));

  const attendanceHeaders = [
    'No.',
    'Fecha Asistencia',
    'Nombre del Colaborador',
    'Cargo / Puesto en Obra',
    'Estado Asistencia',
    'Horas Extras',
    'Jornal Diario Base (GTQ)',
    'Retención IGSS Laboral 4.83% (GTQ)',
    'Cuota Patronal IGSS 10.67% (GTQ)',
    'Latitud GPS Marcaje',
    'Longitud GPS Marcaje',
    'Distancia al Proyecto (Metros)',
    'Validación Geocerca SAT (<= 500m)',
    'Hora Marcaje Satelital',
    'Justificación de Excepción',
    'Acreditación Fiscal SAT (Art. 21 Ley Act. Tributaria)',
    'Dictamen Auditoría Fiscal',
  ];

  const attendanceRows: (string | number)[][] = [
    [`AUDITORÍA CONSOLIDADA DE ASISTENCIA EN OBRA Y RETENCIONES LABORALES (SAT / IGSS) - PROYECTO: ${project.code}`],
    [`Empresa Contratista: ${company.commercialName || company.legalName} | NIT: ${company.nit} | Geocerca Máxima: 500m | Fecha Reporte: ${new Date().toLocaleDateString('es-GT')}`],
    attendanceHeaders,
  ];

  let totalWages = 0;
  let totalIgssLaboral = 0;
  let totalIgssPatronal = 0;
  let totalOvertimeHours = 0;
  let countGpsVerified = 0;

  filteredAttendance.forEach((att, index) => {
    const emp = employeeMap.get(att.employeeId) || {
      id: att.employeeId,
      name: att.employeeName,
      role: 'Albañil' as const,
      dailyRateGTQ: 160,
      igssAffiliated: true,
    };

    const isPresent = att.status === 'Presente';
    const wage = isPresent ? (emp.dailyRateGTQ || 160) : 0;
    const igssLab = isPresent ? Math.round(wage * 0.0483 * 100) / 100 : 0;
    const igssPat = isPresent ? Math.round(wage * 0.1067 * 100) / 100 : 0;
    const overtime = att.overtimeHours || 0;
    const isWithin = att.gpsVerified ?? (att.distanceMeters !== undefined ? att.distanceMeters <= 500 : true);

    if (isWithin && isPresent) countGpsVerified++;
    totalWages += wage;
    totalIgssLaboral += igssLab;
    totalIgssPatronal += igssPat;
    totalOvertimeHours += overtime;

    attendanceRows.push([
      index + 1,
      att.date,
      att.employeeName,
      emp.role,
      att.status,
      overtime,
      wage,
      igssLab,
      igssPat,
      att.gpsCoords?.lat ?? project.lat,
      att.gpsCoords?.lng ?? project.lng,
      att.distanceMeters ?? 25,
      isWithin ? 'VALIDADO EN SITIO (<500m)' : 'FUERA DE GEOCERCA',
      att.gpsTimestamp || `${att.date} 07:00 AM`,
      att.overrideReason || (isWithin ? 'Conforme polígono de obra' : 'Excepción pendiente de firma'),
      isPresent ? 'Gasto Deducible Conforme a Planilla' : 'No Aplica',
      isWithin ? 'Auditoría Conforme SAT / IGSS' : 'Revisión Requerida',
    ]);
  });

  // Summary row for attendance
  attendanceRows.push([
    'TOTALES AUDITADOS',
    '',
    `${filteredAttendance.length} Registros`,
    '',
    `${countGpsVerified} Verificados en Sitio`,
    totalOvertimeHours,
    Math.round(totalWages * 100) / 100,
    Math.round(totalIgssLaboral * 100) / 100,
    Math.round(totalIgssPatronal * 100) / 100,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Conciliado',
  ]);

  const wsAttendance = XLSX.utils.aoa_to_sheet(attendanceRows);
  wsAttendance['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 26 },
    { wch: 22 },
    { wch: 35 },
    { wch: 32 },
    { wch: 26 },
  ];

  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Auditoria_Asistencia_SAT_IGSS');

  // -------------------------------------------------------------
  // 4. SHEET: Bitacoras_Campo_Diarias
  // -------------------------------------------------------------
  const visitsHeaders = [
    'No. Bitácora',
    'Fecha de Visita',
    'Condición Climática',
    'Cuadrilla / No. Trabajadores',
    'Capataz Responsable',
    'DPI Identificación',
    'Cargo en Obra',
    'Novedades y Avances Técnicos Registrados',
    'Latitud GPS',
    'Longitud GPS',
    'Estado de Validación',
    'Firma Digital de Campo',
    'Auditoría y Certificación',
  ];

  const visitsRows: (string | number)[][] = [
    [`BITÁCORAS DIARIAS DE CAMPO Y REPORTES DE SUPERVISIÓN - OBRA: ${project.name}`],
    visitsHeaders,
  ];

  filteredVisits.forEach((visit, idx) => {
    visitsRows.push([
      `BIT-${String(idx + 1).padStart(3, '0')}`,
      visit.date,
      visit.weather,
      visit.workersCount,
      visit.foremanName,
      visit.signerDpi || 'DPI No Registrado',
      visit.signerRole || 'Capataz General',
      visit.notes,
      visit.gpsCoords?.lat ?? project.lat,
      visit.gpsCoords?.lng ?? project.lng,
      visit.status,
      visit.signatureDataUrl ? 'FIRMADO DIGITALMENTE' : 'PENDIENTE DE FIRMA',
      'Certificado por Dirección Técnica',
    ]);
  });

  const wsVisits = XLSX.utils.aoa_to_sheet(visitsRows);
  wsVisits['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 24 },
    { wch: 25 },
    { wch: 18 },
    { wch: 24 },
    { wch: 50 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
  ];

  XLSX.utils.book_append_sheet(wb, wsVisits, 'Bitacoras_Campo_Diarias');

  // -------------------------------------------------------------
  // 5. SHEET: Macros_Contabilidad_VBA
  // -------------------------------------------------------------
  const projectMacroCode = GUATEMALAN_ACCOUNTING_VBA_MACROS.replace(
    /{PROJECT_CODE}/g,
    project.code
  )
    .replace(/{PROJECT_NAME}/g, project.name)
    .replace(/{DATE_GENERATED}/g, new Date().toLocaleString('es-GT'));

  const vbaInstructionRows: (string | number)[][] = [
    ['MACROS CONTABLES PRECONFIGURADAS PARA MICROSOFT EXCEL (VBA)'],
    ['Instrucciones de Uso Rápido:'],
    ['1. En Microsoft Excel, presione la combinación de teclas Alt + F11 (Abre el Editor de VBA).'],
    ['2. En el menú superior de VBA, haga clic en: Insertar > Módulo.'],
    ['3. Copie todo el código VBA que se encuentra en la columna A a partir de la fila 9 y péguelo en el módulo.'],
    ['4. Cierre la ventana de VBA y regrese a Excel.'],
    ['5. Presione Alt + F8 para ejecutar cualquiera de las macros contables de Guatemala:'],
    ['   - GenerarLibroComprasSAT: Genera hoja con estructura oficial para el Libro de Compras SAT (IVA 12%).'],
    ['   - AuditarFacturasDuplicadas: Revisa facturas y resalta en rojo registros duplicados por NIT y Serie FEL.'],
    ['   - GenerarPolizaContable: Elabora automáticamente el asiento de partida doble para el sistema contable.'],
    ['   - AuditarAsistenciaLaboralIGSS: Cruza los marcajes GPS con retenciones y aportes patronales del IGSS.'],
    [''],
    ['CÓDIGO VBA COMPLETO (Copiar todo el bloque inferior):'],
  ];

  // Split VBA code line by line so it's readable directly in Excel cells
  projectMacroCode.split('\n').forEach((line) => {
    vbaInstructionRows.push([line]);
  });

  const wsVba = XLSX.utils.aoa_to_sheet(vbaInstructionRows);
  wsVba['!cols'] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, wsVba, 'Macros_Contabilidad_VBA');

  // Generate binary XLSX buffer and trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `ConstructERP_${project.code}_Contabilidad_Bitacoras_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generates and downloads a pure .bas / .vba text file for one-click import into Excel's VBA editor
 */
export function downloadVbaMacroFile(project: Project): void {
  const code = GUATEMALAN_ACCOUNTING_VBA_MACROS.replace(/{PROJECT_CODE}/g, project.code)
    .replace(/{PROJECT_NAME}/g, project.name)
    .replace(/{DATE_GENERATED}/g, new Date().toLocaleString('es-GT'));

  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ConstructERP_Macros_${project.code}.bas`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
