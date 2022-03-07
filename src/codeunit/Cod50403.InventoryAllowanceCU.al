codeunit 50403 "Inventory Allowance CU"
{
    procedure PostInventoryAllowance(bufferTable: record "Item Location Variant Buffer 4"; PostindDate: Date; TotalAmount: Decimal): Integer
    var
        NoSeriesCU: Codeunit NoSeriesManagement;
        DocNo: Code[20];
        Inventory_Provision_GLAccountNo: Code[20];
        Inventory_Allowance_GLAccountNo: Code[20];
        GenLedSetup: Record "General Ledger Setup";
        GenJournalLine: record "Gen. Journal Line";
        GenJournalLine1: record "Gen. Journal Line";
        cu: Codeunit "Gen. Jnl.-Post Line";
        GlEntry: Integer;
        ReverseLineEntryNo: Integer;
        bsuccess: Boolean;
    begin

        GlEntry := 0;
        GenLedSetup.Get();
        Inventory_Provision_GLAccountNo := GenLedSetup."RDV Inv Prov Exp";
        Inventory_Allowance_GLAccountNo := GenLedSetup."RDV Inv Allowance";
        DocNo := NoSeriesCU.GetNextNo('INALW', Today, true);

        GenJournalLine.Init();
        GenJournalLine.Validate("Posting Date", PostindDate);
        GenJournalLine.Validate("Journal Template Name", 'GENERAL');
        GenJournalLine.Validate("Journal Batch Name", 'INALW');
        GenJournalLine.Validate("Line No.", 1000);
        GenJournalLine.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
        GenJournalLine.Validate("Account No.", Inventory_Provision_GLAccountNo);
        GenJournalLine.Validate(Amount, TotalAmount);
        GenJournalLine.Validate("Document No.", DocNo);
        GenJournalLine.Validate("Tax Group Code", 'TAXABLE');
        GenJournalLine.Validate("Description", 'Inventory Provision Adjustment');
        GenJournalLine.Insert();

        //DocNo := NoSeriesCU.GetNextNo('EXINV-DOC', Today, true);

        GenJournalLine1.Init();
        GenJournalLine1.Validate("Posting Date", PostindDate);
        GenJournalLine1.Validate("Journal Template Name", 'GENERAL');
        GenJournalLine1.Validate("Journal Batch Name", 'INALW');
        GenJournalLine1.Validate("Line No.", 2000);
        GenJournalLine1.Validate("Document No.", DocNo);
        GenJournalLine1.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
        GenJournalLine1.Validate("Account No.", Inventory_Allowance_GLAccountNo);
        GenJournalLine1.Validate(Amount, TotalAmount * (-1));
        GenJournalLine1.Validate("Tax Group Code", 'TAXABLE');
        GenJournalLine1.Validate("Description", 'Inventory Provision Adjustment');

        GenJournalLine1.Insert();

        GlEntry := cu.RunWithCheck(GenJournalLine);

        if (GlEntry > 0) then begin
            GlEntry := cu.RunWithCheck(GenJournalLine1);
        end;
        //if (GlEntry > 0) then begin
        //   TransferToPosted(bufferTable, PostindDate, DocNo);
        //end;

        GenJournalLine.Delete();
        GenJournalLine1.Delete();

        bsuccess := AddNewAllowanceRegisterEntry(DocNo, TotalAmount, PostindDate);
        if not bsuccess then
            Error('Error while inserting allowance register.');

        AddEntryToAllowanceLedgerEntry(bufferTable, PostindDate, TotalAmount);
        exit(GlEntry);
    end;

    procedure PostClosingAllowance(bufferTable: record "Item Location Variant Buffer 4"; PostindDate: Date; TotalAmount: Decimal): Integer
    var
        NoSeriesCU: Codeunit NoSeriesManagement;
        DocNo: Code[20];
        Inventory_Provision_GLAccountNo: Code[20];
        Inventory_Allowance_GLAccountNo: Code[20];
        GenLedSetup: Record "General Ledger Setup";
        GenJournalLine: record "Gen. Journal Line";
        GenJournalLine1: record "Gen. Journal Line";
        cu: Codeunit "Gen. Jnl.-Post Line";
        GlEntry: Integer;
        ReverseLineEntryNo: Integer;
    begin

        GlEntry := 0;
        GenLedSetup.Get();
        Inventory_Provision_GLAccountNo := GenLedSetup."RDV Inv Prov Exp";
        Inventory_Allowance_GLAccountNo := GenLedSetup."RDV Inv Allowance";
        DocNo := NoSeriesCU.GetNextNo('INALW', Today, true);

        GenJournalLine.Init();
        GenJournalLine.Validate("Posting Date", PostindDate);
        GenJournalLine.Validate("Journal Template Name", 'GENERAL');
        GenJournalLine.Validate("Journal Batch Name", 'INALW');
        GenJournalLine.Validate("Line No.", 1000);
        GenJournalLine.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
        GenJournalLine.Validate("Account No.", Inventory_Allowance_GLAccountNo);
        GenJournalLine.Validate(Amount, TotalAmount);
        GenJournalLine.Validate("Document No.", DocNo);
        GenJournalLine.Validate("Tax Group Code", 'TAXABLE');
        GenJournalLine.Validate("Description", 'Inventory Provision Adjustment');
        GenJournalLine.Insert();

        GenJournalLine1.Init();
        GenJournalLine1.Validate("Posting Date", PostindDate);
        GenJournalLine1.Validate("Journal Template Name", 'GENERAL');
        GenJournalLine1.Validate("Journal Batch Name", 'INALW');
        GenJournalLine1.Validate("Line No.", 2000);
        GenJournalLine1.Validate("Document No.", DocNo);
        GenJournalLine1.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
        GenJournalLine1.Validate("Account No.", Inventory_Provision_GLAccountNo);
        GenJournalLine1.Validate(Amount, TotalAmount * (-1));
        GenJournalLine1.Validate("Tax Group Code", 'TAXABLE');
        GenJournalLine1.Validate("Description", 'Inventory Provision Adjustment');

        GenJournalLine1.Insert();

        GlEntry := cu.RunWithCheck(GenJournalLine);

        if (GlEntry > 0) then begin
            GlEntry := cu.RunWithCheck(GenJournalLine1);
        end;
        //if (GlEntry > 0) then begin
        //   TransferToPosted(bufferTable, PostindDate, DocNo);
        //end;

        GenJournalLine.Delete();
        GenJournalLine1.Delete();

        AddNewAllowanceRegisterEntry(DocNo, TotalAmount, PostindDate);

        UpdateAllowanceLedgerEntryForClosing(bufferTable, PostindDate, TotalAmount);
        exit(GlEntry);
    end;

    procedure AddEntryToAllowanceLedgerEntry(bufferTable: Record "Item Location Variant Buffer 4";
    postingDate: Date;
    amount: Decimal)
    var
        allowanceLedgerEntry: Record "RDV Inv All Led Entry";
        allowanceLedgerEntryNew: Record "RDV Inv All Led Entry";
    begin
        bufferTable.Reset();
        if bufferTable.FindSet() then
            repeat
                if bufferTable."New Add Allowance" > 0 then begin
                    allowanceLedgerEntry.Reset();
                    allowanceLedgerEntry.SetRange("Item Ledger Entry No.", bufferTable."Entry No.");
                    if not allowanceLedgerEntry.FindFirst() then begin
                        allowanceLedgerEntryNew.Init();
                        allowanceLedgerEntryNew.Validate("Entry No.", allowanceLedgerEntryNew.GetNextEntryNo());
                        allowanceLedgerEntryNew.Validate("Item Ledger Entry No.", bufferTable."Entry No.");
                        allowanceLedgerEntryNew.Validate("Posting Date", bufferTable."ILE Posting Date");
                        allowanceLedgerEntryNew.Validate("Document No.", bufferTable."ILE Doc No.");
                        allowanceLedgerEntryNew.Validate("Item No.", bufferTable."Item No.");
                        allowanceLedgerEntryNew.Validate(Description, bufferTable."Item No.");
                        allowanceLedgerEntryNew.Validate("Serial No.", bufferTable."Serial No.");
                        allowanceLedgerEntryNew.Validate(Location, bufferTable."Location Code");
                        allowanceLedgerEntryNew.Validate(Quantity, bufferTable.Value11);
                        allowanceLedgerEntryNew.Validate("Remaining Qty.", bufferTable."Remaining Quantity");
                        allowanceLedgerEntryNew.Validate(Open, true);
                        allowanceLedgerEntryNew.Insert();

                        AddEntryToAllowanceDetailLedgerEntry(bufferTable."Entry No.", postingDate, bufferTable."New Add Allowance", 1);
                    end
                    else
                        AddEntryToAllowanceDetailLedgerEntry(bufferTable."Entry No.", postingDate, bufferTable."New Add Allowance", 2);
                end;
            until bufferTable.Next() = 0;
    end;

    procedure UpdateAllowanceLedgerEntryForClosing(bufferTable: Record "Item Location Variant Buffer 4";
    postingDate: Date;
    amount: Decimal)
    var
        allowanceLedgerEntry: Record "RDV Inv All Led Entry";
    begin
        bufferTable.Reset();
        if bufferTable.FindSet() then
            repeat
                allowanceLedgerEntry.Reset();
                allowanceLedgerEntry.SetRange("Item Ledger Entry No.", bufferTable."Entry No.");
                if allowanceLedgerEntry.FindFirst() then begin
                    allowanceLedgerEntry.Validate(Open, false);
                    allowanceLedgerEntry.Validate("Closing Date", postingDate);
                    allowanceLedgerEntry.Validate("Remaining Qty.", 0);
                    allowanceLedgerEntry.Modify();

                    AddEntryToAllowanceDetailLedgerEntry(bufferTable."Entry No.", postingDate, bufferTable."Closing Amount", 3);
                end;

            until bufferTable.Next() = 0;
    end;

    procedure AddEntryToAllowanceDetailLedgerEntry(ILENo: Integer;
    postingDate: Date;
    amount: Decimal;
    entryType: Integer)
    var
        detailLedEntries: Record "RDV Inv All Detail Led Entry";
        entryTypeOptions: Option "Initial Entry","Adjust","Closing Entry";
    begin
        //bufferTable.Reset();
        //if bufferTable.FindSet() then
        //repeat
        detailLedEntries.Init();
        detailLedEntries.Validate("Entry No.", detailLedEntries.GetNextEntryNo());

        case entryType of
            1:
                detailLedEntries.Validate("Entry Type", entryTypeOptions::"Initial Entry");
            2:
                detailLedEntries.Validate("Entry Type", entryTypeOptions::Adjust);
            3:
                detailLedEntries.Validate("Entry Type", entryTypeOptions::"Closing Entry");
        end;
        detailLedEntries.Validate("Item Led Entry No.", ILENo);
        detailLedEntries.Validate("Posting Date", postingDate);
        detailLedEntries.Validate("Allowance Amt", amount);
        detailLedEntries.Insert();

        //until bufferTable.Next() = 0
    end;

    procedure AddNewAllowanceRegisterEntry(docNo: Code[20]; amount: Decimal; postingDate: Date): Boolean
    var
        newInvRegEntry: Record "RDV Inv Allow Register";
    begin

        newInvRegEntry.Init();
        newInvRegEntry.Validate("Entry No.", newInvRegEntry.GetNextEntryNo());
        newInvRegEntry.Validate("Document No.", docNo);
        newInvRegEntry.Validate("Allow Amount", amount);
        newInvRegEntry.Validate("Creation Date", postingDate);
        exit(newInvRegEntry.Insert());
    end;
}


