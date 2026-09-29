import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.cell.cell import MergedCell
from copy import copy

OUTPUT_DOWNLOADS = '/home/youngltc/Downloads/1737_DN_SE_48_Report5_UnitTest.xlsx'
OUTPUT_WORKSPACE = '/home/youngltc/Documents/Coding/lexigrow/LexiGrow_16UC_UnitTest_Report.xlsx'

wb = openpyxl.load_workbook(OUTPUT_WORKSPACE)

ws_ref = wb['LVFS-01']
ws = wb['LVFS-07']

print('1. Unmerging all existing merges in LVFS-07 rows 1 to 8...')
merges_to_remove = [rng for rng in list(ws.merged_cells.ranges) if rng.min_row <= 8]
for rng in merges_to_remove:
    ws.unmerge_cells(str(rng))

print('2. Copying structure, values, formatting and merges from LVFS-01 (rows 1-7)...')
# Clear rows 1 to 7
for r in range(1, 8):
    for c in range(1, 26):
        cell = ws.cell(r, c)
        if not isinstance(cell, MergedCell):
            cell.value = None

# Copy cell formatting and values from LVFS-01
for r in range(1, 8):
    ws.row_dimensions[r].height = ws_ref.row_dimensions[r].height
    for c in range(1, 26):
        ref_cell = ws_ref.cell(r, c)
        cell = ws.cell(r, c)
        cell.font = copy(ref_cell.font)
        cell.fill = copy(ref_cell.fill)
        cell.border = copy(ref_cell.border)
        cell.alignment = copy(ref_cell.alignment)
        cell.number_format = ref_cell.number_format
        if ref_cell.value is not None:
            cell.value = ref_cell.value

# Apply standard merges from LVFS-01
ref_merges_1_to_8 = [rng for rng in ws_ref.merged_cells.ranges if rng.min_row <= 8]
for rng in ref_merges_1_to_8:
    ws.merge_cells(str(rng))

# 3. Update LVFS-07 specific values in rows 2, 4, 5, 7
ws['C2'] = "=Functions!E17"
ws['L2'] = "=Functions!D17"
ws['C3'] = "youngltc"
ws['L3'] = "youngltc"
ws['C4'] = 150
ws['L4'] = '=IF(Functions!E6<>"N/A",SUM(C4*Functions!E6/1000,-O7),"N/A")'
ws['C5'] = "Inspect JWT token and account status to return current authenticated user details, including linked children for Parent role."

# Row 7 formulas
ws['A7'] = '=COUNTIF(F41:HQ41,"P")'
ws['C7'] = '=COUNTIF(F41:HQ41,"F")'
ws['F7'] = '=SUM(O7,-A7,-C7)'
ws['L7'] = '=COUNTIF(E40:HQ40,"N")'
ws['M7'] = '=COUNTIF(E40:HQ40,"A")'
ws['N7'] = '=COUNTIF(E40:HQ40,"B")'
ws['O7'] = '=COUNTA(E9:HT9)'

# 4. Fix Column D and other column dimensions in LVFS-07 to match LVFS-01
for col_letter, col_dim in ws_ref.column_dimensions.items():
    ws.column_dimensions[col_letter].width = col_dim.width

# Ensure Column D is visible and has proper width (not hidden like the defective template)
ws.column_dimensions['D'].hidden = False
ws.column_dimensions['D'].width = 50.13
ws.column_dimensions['E'].hidden = True
ws.column_dimensions['E'].width = 1.88


# 5. Verify and ensure Statistics sheet row 18 points correctly
ws_stat = wb['Statistics']
ws_stat.cell(18, 1).value = 7
ws_stat.cell(18, 2).value = 'LVFS-07'
ws_stat.cell(18, 2).hyperlink = "#'LVFS-07'!A1"
ws_stat.cell(18, 3).value = "='LVFS-07'!A7"
ws_stat.cell(18, 4).value = "='LVFS-07'!C7"
ws_stat.cell(18, 5).value = "='LVFS-07'!F7"
ws_stat.cell(18, 6).value = "='LVFS-07'!L7"
ws_stat.cell(18, 7).value = "='LVFS-07'!M7"
ws_stat.cell(18, 8).value = "='LVFS-07'!N7"
ws_stat.cell(18, 9).value = "='LVFS-07'!O7"

wb.save(OUTPUT_DOWNLOADS)
wb.save(OUTPUT_WORKSPACE)

print('Successfully fixed LVFS-07 and saved both workbooks!')
