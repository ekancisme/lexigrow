import openpyxl
from copy import copy
from openpyxl.styles import Border, Side, Font, PatternFill, Alignment

FILES = [
    '/home/youngltc/Downloads/1737_DN_SE_48_Report5_UnitTest.xlsx',
    '/home/youngltc/Documents/Coding/lexigrow/LexiGrow_16UC_UnitTest_Report.xlsx'
]

def copy_cell_style(src_cell, dst_cell, keep_val=True):
    if src_cell.has_style:
        dst_cell.font = copy(src_cell.font)
        dst_cell.border = copy(src_cell.border)
        dst_cell.fill = copy(src_cell.fill)
        dst_cell.number_format = src_cell.number_format
        dst_cell.protection = copy(src_cell.protection)
        dst_cell.alignment = copy(src_cell.alignment)
    if not keep_val and src_cell.value is not None:
        dst_cell.value = src_cell.value

for f in FILES:
    print(f'Fixing {f}...')
    wb = openpyxl.load_workbook(f)
    ref = wb['LVFS-01']
    
    # ----------------------------------------------------
    # FIX LVFS-15
    # ----------------------------------------------------
    ws15 = wb['LVFS-15']
    print('  Fixing LVFS-15...')
    
    # 1. Reset data row heights (rows 41, 42) back to 13.5
    ws15.row_dimensions[41].height = 13.5
    ws15.row_dimensions[42].height = 13.5
    
    # Ensure all data rows up to 47 are 13.5
    for r in range(10, 48):
        ws15.row_dimensions[r].height = 13.5
        
    # Defect ID row (48) height = 79.5, row 49 = 12.0
    ws15.row_dimensions[48].height = 79.5
    ws15.row_dimensions[49].height = 12.0
    
    # 2. Fix Result Block borders and styles (rows 45, 46, 47, 48)
    # Reference: LVFS-01 rows 40, 41, 42, 43
    res_rows_15 = [45, 46, 47, 48]
    ref_rows = [40, 41, 42, 43]
    
    # Find max col in LVFS-15
    max_c_15 = 15 # A to O
    for r_idx in range(4):
        target_r = res_rows_15[r_idx]
        src_r = ref_rows[r_idx]
        
        # Col A
        copy_cell_style(ref.cell(src_r, 1), ws15.cell(target_r, 1), keep_val=True)
        # Col B, C, D
        for c in range(2, 5):
            copy_cell_style(ref.cell(src_r, c), ws15.cell(target_r, c), keep_val=True)
        # Test case cols F to O
        for c in range(6, 16):
            copy_cell_style(ref.cell(src_r, c), ws15.cell(target_r, c), keep_val=True)
            # Ensure text alignment center for test results
            if ws15.cell(target_r, c).value is not None:
                ws15.cell(target_r, c).alignment = Alignment(horizontal='center', vertical='center')
                
    # ----------------------------------------------------
    # FIX LVFS-16
    # ----------------------------------------------------
    ws16 = wb['LVFS-16']
    print('  Fixing LVFS-16...')
    
    # 1. Fix column dimensions to match LVFS-01 standard
    ws16.column_dimensions['A'].width = 8.13
    ws16.column_dimensions['B'].width = 13.38
    ws16.column_dimensions['C'].width = 10.88
    ws16.column_dimensions['D'].width = 50.13
    ws16.column_dimensions['D'].hidden = False
    ws16.column_dimensions['E'].width = 1.88
    ws16.column_dimensions['E'].hidden = True
    ws16.column_dimensions['F'].width = 5.5
    
    # 2. Fix header and data row heights
    ws16.row_dimensions[1].height = 22.5
    ws16.row_dimensions[2].height = 15.0
    ws16.row_dimensions[8].height = 12.0
    ws16.row_dimensions[9].height = 45.0
    
    # Ensure all data rows up to 43 are 13.5
    for r in range(10, 44):
        ws16.row_dimensions[r].height = 13.5
        
    # Executed Date row (43) is 13.5! Defect ID row (44) is 79.5! Row 45 is 12.0!
    ws16.row_dimensions[43].height = 13.5
    ws16.row_dimensions[44].height = 79.5
    ws16.row_dimensions[45].height = 12.0
    
    # 3. Fix borders on Row 40 (Log message before Type)
    for c in range(1, 15):
        cell_40 = ws16.cell(40, c)
        if cell_40.border:
            # ensure bottom is thin, not double
            new_bot = Side(style='thin', color=cell_40.border.bottom.color) if cell_40.border.bottom else Side(style='thin')
            cell_40.border = Border(
                left=cell_40.border.left,
                right=cell_40.border.right,
                top=cell_40.border.top,
                bottom=new_bot
            )
            
    # 4. Fix Result Block borders and styles (rows 41, 42, 43, 44)
    res_rows_16 = [41, 42, 43, 44]
    for r_idx in range(4):
        target_r = res_rows_16[r_idx]
        src_r = ref_rows[r_idx]
        
        # Col A
        copy_cell_style(ref.cell(src_r, 1), ws16.cell(target_r, 1), keep_val=True)
        # Col B, C, D
        for c in range(2, 5):
            copy_cell_style(ref.cell(src_r, c), ws16.cell(target_r, c), keep_val=True)
        # Test case cols F to M
        for c in range(6, 14):
            copy_cell_style(ref.cell(src_r, c), ws16.cell(target_r, c), keep_val=True)
            if ws16.cell(target_r, c).value is not None:
                ws16.cell(target_r, c).alignment = Alignment(horizontal='center', vertical='center')

    wb.save(f)
    print(f'  Successfully saved {f}!')

print('All fixes applied and verified!')
