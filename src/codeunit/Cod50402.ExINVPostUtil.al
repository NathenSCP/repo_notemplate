codeunit 50402 "ExINV Post Util"
{
    /// <summary>
    /// PostGeneralJournalForExINV.
    /// </summary>
    /// <param name="bufferTable">record "Item Location Variant Buffer 2".</param>
    /// <param name="PostindDate">Date.</param>
    /// <param name="TotalExRateAdj">Decimal.</param>
    /// <returns>Return value of type Integer.</returns>
    procedure PostGeneralJournalForExINV(bufferTable: record "Item Location Variant Buffer 2"; PostindDate: Date; TotalExRateAdj: Decimal): Integer
    var
        NoSeriesCU: Codeunit NoSeriesManagement;
        DocNo: Code[20];
        Inventory_Exchange_Adjustment_GLAccountNo: Code[20];
        Inventory_Exchange_Gain_Loss_GLAccountNo: Code[20];
        GenLedSetup: Record "General Ledger Setup";
        GenJournalLine: record "Gen. Journal Line";
        GenJournalLine1: record "Gen. Journal Line";
        cu: Codeunit "Gen. Jnl.-Post Line";
        GlEntry: Integer;
        ReverseLineEntryNo: Integer;
    begin

        ReverseLineEntryNo := CreateGeneralJournalForPrevAdjustment(PostindDate);

        //if (ReverseLineEntryNo <= 0) then
        //    Error('Operation failed due to problem posting reverse entries !');
        GlEntry := 0;
        GenLedSetup.Get();
        Inventory_Exchange_Adjustment_GLAccountNo := GenLedSetup."Inventory Exchange Adjustment";
        Inventory_Exchange_Gain_Loss_GLAccountNo := GenLedSetup."Inventory Exchange Gain/Loss";
        DocNo := NoSeriesCU.GetNextNo('EXINV', Today, true);

        GenJournalLine.Init();
        GenJournalLine.Validate("Posting Date", PostindDate);
        GenJournalLine.Validate("Journal Template Name", 'GENERAL');
        GenJournalLine.Validate("Journal Batch Name", 'EXINV');
        GenJournalLine.Validate("Line No.", 1000);
        GenJournalLine.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
        GenJournalLine.Validate("Account No.", Inventory_Exchange_Adjustment_GLAccountNo);
        GenJournalLine.Validate(Amount, TotalExRateAdj);
        GenJournalLine.Validate("Document No.", DocNo);
        GenJournalLine.Validate("Tax Group Code", 'TAXABLE');
        GenJournalLine.Validate("Description", 'Inventory Ex-Rate Adjustment');
        GenJournalLine.Insert();

        //DocNo := NoSeriesCU.GetNextNo('EXINV-DOC', Today, true);

        GenJournalLine1.Init();
        GenJournalLine1.Validate("Posting Date", PostindDate);
        GenJournalLine1.Validate("Journal Template Name", 'GENERAL');
        GenJournalLine1.Validate("Journal Batch Name", 'EXINV');
        GenJournalLine1.Validate("Line No.", 2000);
        GenJournalLine1.Validate("Document No.", DocNo);
        GenJournalLine1.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
        GenJournalLine1.Validate("Account No.", Inventory_Exchange_Gain_Loss_GLAccountNo);
        GenJournalLine1.Validate(Amount, TotalExRateAdj * (-1));
        GenJournalLine1.Validate("Tax Group Code", 'TAXABLE');
        GenJournalLine1.Validate("Description", 'Inventory Ex-Rate Adjustment');

        GenJournalLine1.Insert();

        GlEntry := cu.RunWithCheck(GenJournalLine);

        if (GlEntry > 0) then begin
            GlEntry := cu.RunWithCheck(GenJournalLine1);
        end;
        if (GlEntry > 0) then begin
            TransferToPosted(bufferTable, PostindDate, DocNo);
        end;

        GenJournalLine.Delete();
        GenJournalLine1.Delete();

        AddNewInvRegisterEntry(DocNo, TotalExRateAdj, PostindDate);
        exit(GlEntry);
    end;

    /// <summary>
    /// PostGeneralJournalForExINVCOGS.
    /// </summary>
    /// <param name="bufferTable">record "Item Location Variant Buffer 3".</param>
    /// <param name="PostindDate">Date.</param>
    /// <param name="TotalExRateAdj">Decimal.</param>
    /// <returns>Return value of type Integer.</returns>
    procedure PostGeneralJournalForExINVCOGS(bufferTable: record "Item Location Variant Buffer 3";
    PostindDate: Date; TotalExRateAdj: Decimal): Integer
    var
        NoSeriesCU: Codeunit NoSeriesManagement;
        DocNo: Code[20];
        Inventory_Exchange_Adjustment_GLAccountNo: Code[20];
        Inventory_Exchange_Gain_Loss_GLAccountNo: Code[20];
        GenLedSetup: Record "General Ledger Setup";
        GenJournalLine: record "Gen. Journal Line";
        GenJournalLine1: record "Gen. Journal Line";
        cu: Codeunit "Gen. Jnl.-Post Line";
        GlEntry: Integer;
        ReverseLineEntryNo: Integer;
    begin

        GlEntry := 0;
        GenLedSetup.Get();
        Inventory_Exchange_Adjustment_GLAccountNo := GenLedSetup."COGS Exchange Adjustment";
        Inventory_Exchange_Gain_Loss_GLAccountNo := GenLedSetup."COGS Exchange Gain/Loss";
        DocNo := NoSeriesCU.GetNextNo('EXCOG', Today, true);

        GenJournalLine.Init();
        GenJournalLine.Validate("Posting Date", PostindDate);
        GenJournalLine.Validate("Journal Template Name", 'GENERAL');
        GenJournalLine.Validate("Journal Batch Name", 'EXCOG');
        GenJournalLine.Validate("Line No.", 1000);
        GenJournalLine.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
        GenJournalLine.Validate("Account No.", Inventory_Exchange_Adjustment_GLAccountNo);
        GenJournalLine.Validate(Amount, TotalExRateAdj);
        GenJournalLine.Validate("Document No.", DocNo);
        GenJournalLine.Validate("Tax Group Code", 'TAXABLE');
        GenJournalLine.Validate("Description", 'COGS Ex-Rate Adjustment');
        GenJournalLine.Insert();

        //DocNo := NoSeriesCU.GetNextNo('EXINV-DOC', Today, true);

        GlEntry := cu.RunWithCheck(GenJournalLine);

        if (GlEntry > 0) then begin

            GenJournalLine1.Init();
            GenJournalLine1.Validate("Posting Date", PostindDate);
            GenJournalLine1.Validate("Journal Template Name", 'GENERAL');
            GenJournalLine1.Validate("Journal Batch Name", 'EXCOG');
            GenJournalLine1.Validate("Line No.", 2000);
            GenJournalLine1.Validate("Document No.", DocNo);
            GenJournalLine1.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
            GenJournalLine1.Validate("Account No.", Inventory_Exchange_Gain_Loss_GLAccountNo);
            GenJournalLine1.Validate(Amount, TotalExRateAdj * (-1));
            GenJournalLine1.Validate("Tax Group Code", 'TAXABLE');
            GenJournalLine1.Validate("Description", 'COGS Ex-Rate Adjustment');

            GenJournalLine1.Insert();

            GlEntry := cu.RunWithCheck(GenJournalLine1);
        end;
        if (GlEntry > 0) then begin
            TransferToPostedCOGS(bufferTable, PostindDate, DocNo);
        end;

        GenJournalLine.Delete();
        GenJournalLine1.Delete();

        AddNewCOGSRegisterEntry(DocNo, TotalExRateAdj, PostindDate);

        exit(GlEntry);
    end;

    /// <summary>
    /// TransferToPosted.
    /// </summary>
    /// <param name="bufferTable">record "Item Location Variant Buffer 2".</param>
    /// <param name="postingDate">Date.</param>
    /// <param name="docNo">Code[20].</param>
    procedure TransferToPosted(bufferTable: record "Item Location Variant Buffer 2"; postingDate: Date; docNo: Code[20])
    var
        //ValueEntry: Record "Value Entry";
        purchInvoiceExcRate: record "Purchase Invoice Exchange Rate";
        postedInvoiceExchRate: record "Posted Inv Exch Adj";
    begin

        if bufferTable.FindSet() then
            repeat
                //if bufferTable."Exchange Adjustment Amount" > 0 then begin

                purchInvoiceExcRate.Reset();
                purchInvoiceExcRate.SetRange("Value Entry No.", bufferTable."Value Entry No.");
                purchInvoiceExcRate.SetRange("Item Ledger Entry No.", bufferTable."Entry No.");
                //purchInvoiceExcRate.SetRange("Purchase Posted", false);

                if purchInvoiceExcRate.FindFirst() then begin
                    postedInvoiceExchRate.Init();
                    postedInvoiceExchRate."Entry No." := postedInvoiceExchRate.GetNextEntryNo();
                    postedInvoiceExchRate."Posting Date" := postingDate;
                    postedInvoiceExchRate."Document No." := docNo;
                    postedInvoiceExchRate."ILE Posting Date" := bufferTable."ILE Posting Date";
                    postedInvoiceExchRate."ILE Doc No." := bufferTable."ILE Doc No.";
                    postedInvoiceExchRate."ILE Entry No." := bufferTable."Entry No.";
                    postedInvoiceExchRate."Item No." := bufferTable."Item No.";
                    //postedInvoiceExchRate.Description := bufferTable.."Item Description";
                    postedInvoiceExchRate."Serial No." := bufferTable."Serial No.";
                    postedInvoiceExchRate.Quantity := bufferTable."Value11";
                    postedInvoiceExchRate."Remaining Qty." := bufferTable."Remaining Quantity";
                    postedInvoiceExchRate."Purch Inv Exch Rate" := bufferTable."Purchase Invoice Exch Rate";
                    postedInvoiceExchRate."Purch Inv Total Price" := bufferTable."Purchase Invoice Total Price";
                    postedInvoiceExchRate."Purch Inv Unit Price" := bufferTable."Purchase Invoice Unit Price";
                    postedInvoiceExchRate."Spot Exch Rate" := bufferTable."Spot Exch Rate";
                    postedInvoiceExchRate."Exch Adj" := bufferTable."Exchange Adjustment Amount";
                    postedInvoiceExchRate.Insert();

                    purchInvoiceExcRate."Purchase Posted" := true;
                    purchInvoiceExcRate.Modify();
                end;

            // end;
            until bufferTable.Next() = 0;
    end;

    /// <summary>
    /// TransferToPostedCOGS.
    /// </summary>
    /// <param name="bufferTable">record "Item Location Variant Buffer 3".</param>
    /// <param name="postingDate">Date.</param>
    /// <param name="docNo">Code[20].</param>
    procedure TransferToPostedCOGS(bufferTable: record "Item Location Variant Buffer 3"; postingDate: Date; docNo: Code[20])
    var
        // ValueEntry: Record "Value Entry";
        purchInvoiceExcRate: record "Purchase Invoice Exchange Rate";
        postedInvoiceExchRate: record "Posted COGS Exch Adj";
    // ILE: Record "Item Ledger Entry";
    begin

        if bufferTable.FindSet() then
            repeat
                //   ILE.Reset;
                //  ILE.SetRange("Item No.", bufferTable."Item No.");
                //  ILE.SetRange("Location Code", bufferTable."Location Code");
                // ILE.SetFilter("Serial No.", bufferTable."Serial No.");

                // if ILE.FindLast then begin

                purchInvoiceExcRate.Reset();
                purchInvoiceExcRate.SetRange("Item No.", bufferTable."Item No.");
                purchInvoiceExcRate.SetRange("Serial No.", bufferTable."Serial No.");
                purchInvoiceExcRate.SetRange("Location Code", bufferTable."Location Code");
                //purchInvoiceExcRate.SetRange("Sales Posted", false);

                if purchInvoiceExcRate.FindFirst() then begin
                    postedInvoiceExchRate.Init();
                    postedInvoiceExchRate."Entry No." := postedInvoiceExchRate.GetNextEntryNo();
                    postedInvoiceExchRate."Posting Date" := postingDate;
                    postedInvoiceExchRate."Document No." := docNo;
                    postedInvoiceExchRate."ILE Posting Date" := bufferTable."ILE Posting Date";
                    postedInvoiceExchRate."ILE Doc No." := bufferTable."ILE Doc No.";
                    postedInvoiceExchRate."ILE Entry No." := bufferTable."Entry No.";
                    postedInvoiceExchRate."Item No." := bufferTable."Item No.";
                    //postedInvoiceExchRate.Description := bufferTable.."Item Description";
                    postedInvoiceExchRate."Serial No." := bufferTable."Serial No.";
                    postedInvoiceExchRate.Quantity := bufferTable."Value11";
                    //postedInvoiceExchRate."Remaining Qty." := bufferTable."Remaining Quantity";
                    postedInvoiceExchRate."Purch Inv Exch Rate" := bufferTable."Purchase Invoice Exch Rate";
                    postedInvoiceExchRate."Purch Inv Total Price" := bufferTable."Purchase Invoice Total Price";
                    postedInvoiceExchRate."Purch Inv Unit Price" := bufferTable."Purchase Invoice Unit Price";
                    postedInvoiceExchRate."Spot Exch Rate" := bufferTable."Spot Exch Rate";
                    postedInvoiceExchRate."Exch Adj" := bufferTable."Exchange Adjustment Amount";
                    postedInvoiceExchRate.Insert();

                    purchInvoiceExcRate."Sales Posted" := true;
                    purchInvoiceExcRate.Modify();
                end;
            // end;
            until bufferTable.Next() = 0;
    end;


    /// <summary>
    /// AddNewInvRegisterEntry.
    /// </summary>
    /// <param name="docNo">Code[20].</param>
    /// <param name="amount">Decimal.</param>
    /// <param name="postingDate">Date.</param>
    procedure AddNewInvRegisterEntry(docNo: Code[20]; amount: Decimal; postingDate: Date)
    var
        newInvRegEntry: Record "Inv Exc Rate Adj Registers";
    begin

        newInvRegEntry.Reset();
        newInvRegEntry.SetRange(Reverse, false);
        newInvRegEntry.ModifyAll(Reverse, true);

        newInvRegEntry.Init();
        newInvRegEntry.Validate("Entry No.", newInvRegEntry.FindNextEntryNo());
        newInvRegEntry.Validate("Document No.", docNo);
        newInvRegEntry.Validate(Amount, amount);
        newInvRegEntry.Validate(Reverse, false);
        newInvRegEntry.Validate("Creation Date", postingDate);
        newInvRegEntry.Insert();
    end;

    /// <summary>
    /// AddNewCOGSRegisterEntry.
    /// </summary>
    /// <param name="docNo">Code[20].</param>
    /// <param name="amount">Decimal.</param>
    /// <param name="postingDate">Date.</param>
    procedure AddNewCOGSRegisterEntry(docNo: Code[20]; amount: Decimal; postingDate: Date)
    var
        newCOGSRegEntry: Record "CoGs Exc Rate Adj Registers";
    begin

        newCOGSRegEntry.Init();
        newCOGSRegEntry.Validate("Entry No.", newCOGSRegEntry.FindNextEntryNo());
        newCOGSRegEntry.Validate("Document No.", docNo);
        newCOGSRegEntry.Validate(Amount, amount);
        newCOGSRegEntry.Validate("Creation Date", postingDate);
        newCOGSRegEntry.Insert();
    end;

    /// <summary>
    /// CreateGeneralJournalForPrevAdjustment.
    /// </summary>
    /// <param name="PostindDate">Date.</param>
    /// <returns>Return value of type Integer.</returns>
    procedure CreateGeneralJournalForPrevAdjustment(PostindDate: Date): Integer
    var
        NoSeriesCU: Codeunit NoSeriesManagement;
        DocNo: Code[20];
        Inventory_Exchange_Adjustment_GLAccountNo: Code[20];
        Inventory_Exchange_Gain_Loss_GLAccountNo: Code[20];
        GenLedSetup: Record "General Ledger Setup";
        GenJournalLine: record "Gen. Journal Line";
        GenJournalLine1: record "Gen. Journal Line";
        cu: Codeunit "Gen. Jnl.-Post Line";
        GlEntry: Integer;
        invRegEntry: Record "Inv Exc Rate Adj Registers";
        lineno: Integer;
    begin

        GlEntry := 0;
        GenLedSetup.Get();
        Inventory_Exchange_Adjustment_GLAccountNo := GenLedSetup."Inventory Exchange Adjustment";
        Inventory_Exchange_Gain_Loss_GLAccountNo := GenLedSetup."Inventory Exchange Gain/Loss";
        DocNo := NoSeriesCU.GetNextNo('EXINV', Today, true);

        invRegEntry.Reset();
        invRegEntry.SetRange(Reverse, false);
        if invRegEntry.FindSet() then
            lineno := 1000;
        repeat

            if (invRegEntry.Amount <> 0) then begin
                GenJournalLine.Init();
                GenJournalLine.Validate("Posting Date", PostindDate);
                GenJournalLine.Validate("Journal Template Name", 'GENERAL');
                GenJournalLine.Validate("Journal Batch Name", 'EXINV');
                GenJournalLine.Validate("Line No.", lineno);
                GenJournalLine.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
                GenJournalLine.Validate("Account No.", Inventory_Exchange_Adjustment_GLAccountNo);
                GenJournalLine.Validate(Amount, (-1) * invRegEntry.Amount);
                GenJournalLine.Validate("Document No.", DocNo);
                GenJournalLine.Validate("Tax Group Code", 'TAXABLE');
                GenJournalLine.Validate("Description", 'Reverse Inventory Ex-Rate Adjustment');
                GenJournalLine.Insert();


                lineno := lineno + 1000;

                GenJournalLine1.Init();
                GenJournalLine1.Validate("Posting Date", PostindDate);
                GenJournalLine1.Validate("Journal Template Name", 'GENERAL');
                GenJournalLine1.Validate("Journal Batch Name", 'EXINV');
                GenJournalLine1.Validate("Line No.", lineno);
                GenJournalLine1.Validate("Document No.", DocNo);
                GenJournalLine1.Validate("Account Type", GenJournalLine."Account Type"::"G/L Account");
                GenJournalLine1.Validate("Account No.", Inventory_Exchange_Gain_Loss_GLAccountNo);
                GenJournalLine1.Validate(Amount, invRegEntry.Amount);
                GenJournalLine1.Validate("Tax Group Code", 'TAXABLE');
                GenJournalLine1.Validate("Description", 'Reverse Inventory Ex-Rate Adjustment');

                GenJournalLine1.Insert();
                lineno := lineno + 1000;

                GlEntry := cu.RunWithCheck(GenJournalLine);

                if (GlEntry > 0) then begin
                    GlEntry := cu.RunWithCheck(GenJournalLine1);
                end;

                GenJournalLine.Delete();
                GenJournalLine1.Delete();
            end;
        until invRegEntry.Next() = 0;

        exit(lineno);
    end;
}


