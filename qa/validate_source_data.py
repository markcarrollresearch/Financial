#!/usr/bin/env python3
"""Read-only source validation for DOUGLAS COUNTY synthetic Power BI data v1.0.
Usage: python validate_source_data.py C:\\CountyDashboard\\FinancialIntelligence
Requires Python 3 standard library only. No network or dataset mutation.
"""
import csv, sys, json
from pathlib import Path
from decimal import Decimal
from collections import defaultdict
from datetime import date

CUT = date.fromisoformat('2026-09-30')
D = lambda x: Decimal(str(x or '0'))
root = Path(sys.argv[1] if len(sys.argv)>1 else '.').expanduser()
if not (root/'csv').is_dir():
    matches = list(root.rglob('FactBudget.csv'))
    if matches: root=matches[0].parent.parent
    else: sys.exit('Cannot locate csv/FactBudget.csv under '+str(root))

def rows(name):
    with (root/'csv'/f'{name}.csv').open(newline='',encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

tbls = ['DimDate','DimDivision','DimExpenseCategory','DimServiceMetric','FactPublishedBenchmarks',
        'FactBudget','FactGLExpenses','FactARInvoices','FactARPaymentApplications',
        'FactDepositBatches','FactCashReceipts','FactGLCashPostings','FactAgencyRemittances',
        'FactServiceVolumes','FactExceptions']
t={n:rows(n) for n in tbls}
checks=[]
def test(label, condition, detail=''):
    checks.append({'check': label,'pass': bool(condition),'detail': str(detail)})

def unique(tn, key):
    ids=[r[key] for r in t[tn]]
    test(f'{tn}.{key} unique',len(ids)==len(set(ids)),f'{len(ids)} rows; {len(set(ids))} unique')

for tn,key in [('DimDate','Date'),('DimDivision','DivisionID'),('DimExpenseCategory','ExpenseCategoryID'),
 ('DimServiceMetric','ServiceMetricID'),('FactBudget','BudgetLineID'),('FactGLExpenses','ExpenseEntryID'),
 ('FactARInvoices','InvoiceID'),('FactARPaymentApplications','ApplicationID'),
 ('FactDepositBatches','DepositBatchID'),('FactCashReceipts','ReceiptID'),
 ('FactGLCashPostings','GLCashPostingID'),('FactAgencyRemittances','RemittanceID'),
 ('FactServiceVolumes','VolumeID'),('FactExceptions','ExceptionID')]:unique(tn,key)

for child,col,parent,ref in [
 ('FactBudget','DivisionID','DimDivision','DivisionID'),('FactBudget','ExpenseCategoryID','DimExpenseCategory','ExpenseCategoryID'),
 ('FactGLExpenses','DivisionID','DimDivision','DivisionID'),('FactGLExpenses','ExpenseCategoryID','DimExpenseCategory','ExpenseCategoryID'),
 ('FactARInvoices','DivisionID','DimDivision','DivisionID'),('FactARPaymentApplications','InvoiceID','FactARInvoices','InvoiceID'),
 ('FactDepositBatches','DivisionID','DimDivision','DivisionID'),('FactCashReceipts','DepositBatchID','FactDepositBatches','DepositBatchID'),
 ('FactGLCashPostings','DepositBatchID','FactDepositBatches','DepositBatchID'),
 ('FactAgencyRemittances','DivisionID','DimDivision','DivisionID'),('FactServiceVolumes','ServiceMetricID','DimServiceMetric','ServiceMetricID'),
 ('FactExceptions','DivisionID','DimDivision','DivisionID')]:
    vals={r[ref] for r in t[parent]}
    bad=[r[col] for r in t[child] if r[col] not in vals]
    test(f'{child}.{col} references {parent}',not bad,f'{len(bad)} orphan rows')

receipts=t['FactCashReceipts']
receipt_split=sum(1 for r in receipts if D(r['GrossAmount']) != D(r['CountyRetainedAmount'])+D(r['AgencyPassThroughAmount']))
test('Gross receipts = retained + agency pass-through (row-level)', receipt_split==0, f'{receipt_split} mismatches')
bybatch=defaultdict(lambda: Decimal('0'))
for r in receipts:bybatch[r['DepositBatchID']]+=D(r['GrossAmount'])
batchbad=[r['DepositBatchID'] for r in t['FactDepositBatches'] if bybatch[r['DepositBatchID']]!=D(r['ExpectedFromReceipts'])]
test('Deposit expectations reconcile to receipt batches',not batchbad,f'{len(batchbad)} mismatched batches')

budget26=sum(D(r['BudgetAmount']) for r in t['FactBudget'] if r['FiscalYear']=='2026')
budget26ytd=sum(D(r['BudgetAmount']) for r in t['FactBudget'] if '2026-01-01'<=r['MonthStart']<='2026-09-30')
actual26ytd=sum(D(r['ExpenseAmount']) for r in t['FactGLExpenses'] if '2026-01-01'<=r['PostingDate']<='2026-09-30')
test('2026 published annual budget baseline',budget26==D('13567695.00'),f'{budget26:,.2f}')
test('2026 YTD budget expected for reference',budget26ytd==D('9615367.31'),f'{budget26ytd:,.2f}')
test('2026 YTD actual expense expected for reference',actual26ytd==D('9686931.97'),f'{actual26ytd:,.2f}')

invoices={r['InvoiceID']:r for r in t['FactARInvoices']}
paid=defaultdict(lambda:Decimal('0'))
for r in t['FactARPaymentApplications']:
    if r['AppliedDate']<='2026-09-30': paid[r['InvoiceID']]+=D(r['AppliedAmount'])
open_total=Decimal('0'); due_total=Decimal('0'); overapplied=[]
for iid,r in invoices.items():
    if r['InvoiceDate']>'2026-09-30':continue
    amt=D(r['InvoiceAmount']); balance=max(Decimal('0'),amt-paid[iid]);open_total+=balance
    if r['DueDate']<'2026-09-30':due_total+=balance
    if paid[iid]>amt:overapplied.append(iid)
test('No invoice overapplied',not overapplied,f'{len(overapplied)} overapplied')
test('A/R as of 2026-09-30',open_total==D('407695.96'),f'${open_total:,.2f}')
test('Past-due A/R as of 2026-09-30',due_total==D('242507.80'),f'${due_total:,.2f}')

for metric,expected in [('S01',221242),('S05',333291)]:
    total=sum(int(r['Volume']) for r in t['FactServiceVolumes'] if r['ServiceMetricID']==metric and r['MonthStart'].startswith('2025'))
    test(f'2025 reported annual service total {metric}',total==expected,str(total))

ex=t['FactExceptions'];open_ex=[r for r in ex if r['Status']=='Open']
openamt=sum(D(r['AmountUnderReview']) for r in open_ex)
test('10 open exceptions',len(open_ex)==10,str(len(open_ex)))
test('Open amount under review reference',openamt==D('188892.83'),f'${openamt:,.2f}')
test('All exceptions zero confirmed losses',all(D(r['ConfirmedLoss'])==0 for r in ex))

by_id={r['DepositBatchID']:r for r in t['FactDepositBatches']}
bankshort=by_id['DB20260814D03']
test('Seeded bank shortfall $975.25',D(bankshort['ExpectedFromReceipts'])-D(bankshort['BankAmount'])==D('975.25'))

# Financially material cutoff discipline: pending/normal timing is NOT an exception.
current_batches=[r for r in t['FactDepositBatches'] if '2026-01-01'<=r['ReceiptDate']<='2026-09-30']
pending_bank=sum((D(r['ExpectedFromReceipts']) for r in current_batches if r['BankStatus']=='Pending Not Due'),Decimal('0'))
matured_bank=sum((abs(D(r['ExpectedFromReceipts'])-D(r['BankAmount'])) for r in current_batches if r['BankStatus']!='Pending Not Due'),Decimal('0'))
posted_by_batch=defaultdict(lambda:Decimal('0'))
for r in t['FactGLCashPostings']: posted_by_batch[r['DepositBatchID']]+=D(r['PostedAmount'])
matured_gl=sum((abs(D(r['ExpectedFromReceipts'])-posted_by_batch[r['DepositBatchID']]) for r in current_batches if r['ReceiptDate']<='2026-09-28'),Decimal('0'))
test('Pending bank batches correctly excluded from exception queue', pending_bank==D('130191.33'),f'${pending_bank:,.2f}')
test('Matured bank absolute differences, not all pending deposits',matured_bank==D('12446.44'),f'${matured_bank:,.2f}')
test('Matured GL clearing differences after illustrative 2-day grace',matured_gl==D('145006.39'),f'${matured_gl:,.2f}')

known_fact_names={n for n in tbls if n.startswith('Fact')}
source_warnings=[r['ExceptionID']+': '+r['SourceTable'] for r in ex if r['SourceTable'] not in known_fact_names]
sourceid={'FactDepositBatches':'DepositBatchID','FactGLExpenses':'ExpenseEntryID','FactARInvoices':'InvoiceID',
          'FactAgencyRemittances':'RemittanceID'}
ref_warnings=[]
for e in ex:
    tn=e['SourceTable'];fk=sourceid.get(tn)
    if not fk: continue
    if e['SourceRecordID'] not in {r[fk] for r in t[tn]}:
        ref_warnings.append(e['ExceptionID']+' source ID not present')

out={'source_folder':str(root),'tables':len(tbls),'source_rows':sum(map(len,t.values())),
     'passed':sum(c['pass'] for c in checks),'checks':len(checks),
     'fails':[c for c in checks if not c['pass']],
     'warnings':[f'Exception source table reference does not match a table name: {x}' for x in source_warnings]+ref_warnings,
     'reference_values':{'annual_2026_budget':str(budget26),'2026_ytd_budget':str(budget26ytd),
                         '2026_ytd_expenses':str(actual26ytd),'ar_open_sep30':str(open_total),
                         'ar_overdue_sep30':str(due_total),'open_exceptions':len(open_ex),'open_exception_amount':str(openamt),
                         'pending_not_due_bank':str(pending_bank),
                         'matured_bank_abs_gap':str(matured_bank),
                         'matured_gl_abs_gap':str(matured_gl)}}
print(json.dumps(out,indent=2))
if out['fails']:sys.exit(1)
