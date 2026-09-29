import openpyxl
from openpyxl.worksheet.dimensions import ColumnDimension, RowDimension
from copy import copy
import datetime

BACKUP_PATH = '/home/youngltc/Downloads/1737_DN_SE_48_Report5_UnitTest_BACKUP.xlsx'
OUTPUT_DOWNLOADS = '/home/youngltc/Downloads/1737_DN_SE_48_Report5_UnitTest.xlsx'
OUTPUT_WORKSPACE = '/home/youngltc/Documents/Coding/lexigrow/LexiGrow_16UC_UnitTest_Report.xlsx'

wb_orig = openpyxl.load_workbook(BACKUP_PATH)
wb_cur = openpyxl.load_workbook(OUTPUT_WORKSPACE)

def restore_sheet_dimensions(ws_src, ws_dst):
    # Clear current custom column dimensions
    ws_dst.column_dimensions.clear()
    for col_letter, col_dim in ws_src.column_dimensions.items():
        new_col_dim = ColumnDimension(
            ws_dst,
            index=col_dim.index,
            width=col_dim.width,
            bestFit=col_dim.bestFit,
            hidden=col_dim.hidden,
            customWidth=col_dim.customWidth,
            outline_level=col_dim.outline_level,
            collapsed=col_dim.collapsed
        )
        ws_dst.column_dimensions[col_letter] = new_col_dim

    # Clear current custom row dimensions
    ws_dst.row_dimensions.clear()
    for row_idx, row_dim in ws_src.row_dimensions.items():
        new_row_dim = RowDimension(
            ws_dst,
            index=row_dim.index,
            height=row_dim.height,
            customHeight=row_dim.customHeight,
            hidden=row_dim.hidden,
            outline_level=row_dim.outline_level,
            collapsed=row_dim.collapsed
        )
        ws_dst.row_dimensions[row_idx] = new_row_dim

# 1. Restore dimensions for Cover, Functions, Statistics
for sheet_name in ['Cover', 'Functions', 'Statistics']:
    if sheet_name in wb_orig.sheetnames and sheet_name in wb_cur.sheetnames:
        restore_sheet_dimensions(wb_orig[sheet_name], wb_cur[sheet_name])
        print(f'Restored dimensions for {sheet_name}')

# 2. Restore dimensions and ensure Executed Date for all 16 sheets
for i in range(1, 17):
    src_name = f'VTFP-{i:02d}'
    dst_name = f'LVFS-{i:02d}'
    ws_src = wb_orig[src_name]
    ws_dst = wb_cur[dst_name]

    # Restore exact original column and row dimensions
    restore_sheet_dimensions(ws_src, ws_dst)

    # Find the Executed Date row in ws_dst
    date_row = None
    for r in range(35, ws_dst.max_row + 1):
        if ws_dst.cell(r, 2).value == 'Executed Date':
            date_row = r
            break

    # Determine number of test cases from row 9
    tc_count = sum(1 for c in range(6, 25) if ws_dst.cell(9, c).value)

    if date_row:
        for tc_idx in range(tc_count):
            col = 6 + tc_idx
            cell = ws_dst.cell(date_row, col)
            cell.value = datetime.datetime(2026, 9, 27, 0, 0)
            # Use original date number format if available, or yyyy-mm-dd
            cell.number_format = 'yyyy-mm-dd'

    print(f'LVFS-{i:02d}: Restored original dimensions, filled Executed Date at row {date_row} ({tc_count} test cases)')

# Save back to both locations
wb_cur.save(OUTPUT_DOWNLOADS)
wb_cur.save(OUTPUT_WORKSPACE)

print('Successfully restored original proportions and updated Executed Date!')
