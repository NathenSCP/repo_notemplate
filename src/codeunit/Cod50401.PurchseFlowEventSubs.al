codeunit 50401 "Purchse Flow Event Subs"
{

    /*
    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Purch.-Post", 'OnAfterPostPurchaseDoc', '', false, false)]
    local procedure OnAfterPostPurchaseDoc(var PurchaseHeader: Record "Purchase Header"; var GenJnlPostLine: Codeunit "Gen. Jnl.-Post Line"; PurchRcpHdrNo: Code[20]; RetShptHdrNo: Code[20]; PurchInvHdrNo: Code[20]; PurchCrMemoHdrNo: Code[20]; CommitIsSupressed: Boolean);
    begin
        Message('a');
    end;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Purch.-Post", 'OnAfterPostPurchLine', '', false, false)]
    local procedure OnAfterPostPurchLine(var PurchaseHeader: Record "Purchase Header"; var PurchaseLine: Record "Purchase Line"; CommitIsSupressed: Boolean);
    begin
        Message('b');
    end;

    [EventSubscriber(ObjectType::Table, Database::"Purchase Line", 'OnAfterInitQtyToInvoice', '', false, false)]
    local procedure OnAfterInitQtyToInvoice(var PurchLine: Record "Purchase Line"; CurrFieldNo: Integer);
    begin
        Message('c');
    end;

    

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Purch.-Post", 'OnFinalizePostingOnBeforeInsertValueEntryRelation', '', false, false)]
    local procedure OnFinalizePostingOnBeforeInsertValueEntryRelation(var Sender: Codeunit "Purch.-Post"; var PurchHeader: Record "Purchase Header"; PurchInvHeader: Record "Purch. Inv. Header"; PurchCrMemoHdr: Record "Purch. Cr. Memo Hdr.");
    begin
        Message('OnFinalizePostingOnBeforeInsertValueEntryRelation');
    end;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Purch.-Post", 'OnPostUpdateInvoiceLineOnAfterPurchOrderLineModify', '', false, false)]
    local procedure OnPostUpdateInvoiceLineOnAfterPurchOrderLineModify(var PurchaseLine: Record "Purchase Line"; var TempPurchaseLine: Record "Purchase Line");
    begin
        Message('OnPostUpdateInvoiceLineOnAfterPurchOrderLineModify');
    end;

    */

    /*
        [EventSubscriber(ObjectType::Codeunit, Codeunit::"Purch.-Post", 'OnAfterFinalizePosting', '', false, false)]
        local procedure OnAfterFinalizePosting(var PurchHeader: Record "Purchase Header"; var PurchRcptHeader: Record "Purch. Rcpt. Header"; var PurchInvHeader: Record "Purch. Inv. Header"; var PurchCrMemoHdr: Record "Purch. Cr. Memo Hdr."; var ReturnShptHeader: Record "Return Shipment Header"; var GenJnlPostLine: Codeunit "Gen. Jnl.-Post Line"; PreviewMode: Boolean; CommitIsSupressed: Boolean);
        begin
            Message('OnAfterFinalizePosting');
        end;
        */

    /*

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Purch.-Post", 'OnAfterPurchInvLineInsert', '', false, false)]
    local procedure OnAfterPurchInvLineInsert(
        var PurchInvLine: Record "Purch. Inv. Line";
            PurchInvHeader: Record "Purch. Inv. Header";
            PurchLine: Record "Purchase Line";
            ItemLedgShptEntryNo: Integer;
            WhseShip: Boolean;
            WhseReceive: Boolean;
            CommitIsSupressed: Boolean;
            PurchHeader: Record "Purchase Header";
            PurchRcptHeader: Record "Purch. Rcpt. Header";
            TempWhseRcptHeader: Record "Warehouse Receipt Header");
    var
        lRecValueEntry: Record "Value Entry";
        lrecSpotValueEntry: Record "Spot Exchange Value Entry";
        lrecItemLedger: Record "Item Ledger Entry";
        lrecCurrExchRates: Record "Currency Exchange Rate";
        StartofWeek: Date;
    begin
        //Message('OnAfterPurchInvLineInsert');
        lrecItemLedger.Reset();
        lrecItemLedger.SetRange("Entry Type", lrecItemLedger."Entry Type"::Purchase);
        lrecItemLedger.SetRange("Document Type", lrecItemLedger."Document Type"::"Purchase Receipt");
        lrecItemLedger.SetFilter("Invoiced Quantity", '>%0');
        lrecItemLedger.SetRange("Document No.", PurchRcptHeader."No.");
        if lrecItemLedger.FindSet() then begin
            REPEAT
                lrecSpotValueEntry.Init();
                lrecSpotValueEntry."Item Ledger Entry No." := lrecItemLedger."Entry No.";
                lrecSpotValueEntry."Item No." := PurchLine."No.";
                lrecSpotValueEntry.Quantity := PurchLine.Quantity;
                lrecSpotValueEntry."Serial No." := lrecItemLedger."Serial No.";
                lRecValueEntry.FindFirstValueEntryByItemLedgerEntryNo(lrecItemLedger."Entry No.");

                lrecSpotValueEntry."Value Entry No." := lRecValueEntry."Entry No.";
                lrecSpotValueEntry."Currency Code" := PurchLine."Currency Code";
                StartofWeek := CALCDATE('<-CW>', PurchHeader."Posting Date");

                lrecCurrExchRates.Reset();
                if lrecCurrExchRates.Get(PurchHeader."Currency Code", StartofWeek) then begin
                    lrecSpotValueEntry."Currency Exch Rate Start Date" := StartofWeek;
                    lrecSpotValueEntry."Sport Exchange Rate" := lrecCurrExchRates."Spot Exchange Rate";
                    lrecSpotValueEntry."System Exchange Rate" := lrecCurrExchRates."Relational Exch. Rate Amount";
                end;


                lrecSpotValueEntry."Cost Per Unit Foreign" := PurchLine."Direct Unit Cost";
                lrecSpotValueEntry."Cost Per Unit Local" := lRecValueEntry."Cost per Unit";
                lrecSpotValueEntry."Entry Type" := lrecItemLedger."Entry Type"::Purchase;
                lrecSpotValueEntry."Document No." := PurchHeader."No.";
                lrecSpotValueEntry.Insert();
            UNTIL lrecItemLedger.Next() = 0;
        end;

    end;
*/


    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Item Jnl.-Post Line", 'OnAfterInsertValueEntry', '', false, false)]
    local procedure OnAfterInsertValueEntry(var ValueEntry: Record "Value Entry"; ItemJournalLine: Record "Item Journal Line"; var ItemLedgerEntry: Record "Item Ledger Entry"; var ValueEntryNo: Integer);
    begin
        //Message('OnAfterInsertValueEntry');
        InsertPurchaseInvoiceExchangeRateEntry(ValueEntry, ItemJournalLine, ItemLedgerEntry, ValueEntryNo);

        if ((ItemLedgerEntry."Entry Type" = ItemLedgerEntry."Entry Type"::Purchase) and
        (ItemLedgerEntry."Document Type" = ItemLedgerEntry."Document Type"::"Purchase Receipt")) then begin
            InsertItemPurchaseDetails(ItemLedgerEntry);
        end;

        UpdateGIASerialNo(ItemLedgerEntry);

    end;

    local procedure UpdateGIASerialNo(ItemLedgerEntry: Record "Item Ledger Entry")
    var
        GIASerialNo: Record "SCP Gci Tracking";
    begin
        GIASerialNo.Reset();
        GIASerialNo.SetRange("Serial No.", ItemLedgerEntry."Serial No.");
        if GIASerialNo.FindSet() then begin
            repeat
                if (ItemLedgerEntry."Entry Type" = ItemLedgerEntry."Entry Type"::Purchase) then begin
                    GIASerialNo."Purch. Entry Type" := ItemLedgerEntry."Entry Type";
                    GIASerialNo."Purch. Doc Type" := ItemLedgerEntry."Document Type";
                    GIASerialNo."Purch. Doc No." := ItemLedgerEntry."Document No.";
                    GIASerialNo."Item Ledger Entry No." := ItemLedgerEntry."Entry No.";
                    GIASerialNo.Modify();
                end
                else
                    if (ItemLedgerEntry."Entry Type" = ItemLedgerEntry."Entry Type"::Sale) then begin
                        GIASerialNo."Sale Entry Type" := ItemLedgerEntry."Entry Type";
                        GIASerialNo."Sale Doc Type" := ItemLedgerEntry."Document Type";
                        GIASerialNo."Sale Doc No." := ItemLedgerEntry."Document No.";
                        GIASerialNo."Item Ledger Entry No." := ItemLedgerEntry."Entry No.";
                        GIASerialNo.Modify();
                    end
            until GIASerialNo.Next() = 0;
        end;
    end;

    local procedure InsertItemPurchaseDetails(ItemLedgerEntry: Record "Item Ledger Entry")
    var
        r: Record "Item Purchase Detail";
        i: Record Item;
        d: Decimal;
        Dollars: Decimal;
        pricediscount: Text;
        centsString: Text;
        report1: Report "RDV ItemBarcodeReport";
        costamount: Decimal;
        price: Decimal;
        util: Codeunit "RDV Util";
    begin
        i.Reset();
        costamount := 0;

        i.Get(ItemLedgerEntry."Item No.");

        r.Init();
        r."Entry No." := r.GetNextEntryNo();
        r."Item No." := ItemLedgerEntry."Item No.";
        r."Serial No." := ItemLedgerEntry."Serial No.";

        r."Item Description" := i.Description;
        //r."Item Price" := i."Unit Price";

        ItemLedgerEntry.CalcFields("Cost Amount (Expected)");
        ItemLedgerEntry.CalcFields("Cost Amount (Actual)");

        if (ItemLedgerEntry."Cost Amount (Expected)" > 0) then
            costamount := ItemLedgerEntry."Cost Amount (Expected)"
        else
            costamount := ItemLedgerEntry."Cost Amount (Actual)";

        if (costamount > 0) then begin

            if (i."Unit Price" > 0) then
                price := i."Unit Price"
            else begin
                if i."Unit Cost" > 0 then begin
                    price := i."Unit Cost"
                end
                else
                    price := i."Last Direct Cost";
            end;

            r."Item Cat" := i."Item Category Code";
            r."Document No." := ItemLedgerEntry."Document No.";
            r."Item Price" := price;
            r."Cost Amount" := costamount;

            d := price / costamount;
            if (d >= 2.99) then begin
                pricediscount := 'N5';
            end
            else begin
                if ((d >= 2) and (d < 2.99)) then begin
                    Dollars := ROUND(d, 1, '<');
                    //PoundsString := Format(Pounds, 0);
                    centsString := Format(ROUND(Dollars * 100 - d, 1), 0);
                    pricediscount := 'L' + centsString;
                end
                else begin
                    if ((d >= 1) and (d < 2)) then begin
                        Dollars := ROUND(d, 1, '<');
                        //PoundsString := Format(Pounds, 0);
                        centsString := Format(ROUND(Dollars * 100 - d, 1), 0);
                        pricediscount := 'K' + centsString;
                    end;
                end;
            end;
            r."Price Discount Code" := pricediscount;
            if (r.Insert()) then begin

                //report1.SetTableView(r);
                //report1.USEREQUESTPAGE(false);
                //report1.RunModal();

                util.DownloadBarcode(r."Document No.");
            end;
        end;
    end;

    local procedure InsertPurchaseInvoiceExchangeRateEntry(

      ValueEntry: Record "Value Entry";
      ItemJournalLine: Record "Item Journal Line";
      ItemLedgerEntry: Record "Item Ledger Entry";
      ValueEntryNo: Integer
    )
    var
        //lRecValueEntry: Record "Value Entry";
        lrecSpotValueEntry: Record "Purchase Invoice Exchange Rate";
        // lrecItemLedger: Record "Item Ledger Entry";
        lrecCurrExchRates: Record "Currency Exchange Rate";
        StartofWeek: Date;
        lRecPurchLine: Record "Purchase Line";
    begin
        //lRecValueEntry.Reset();
        //lRecValueEntry.SetRange("Document Type", lRecValueEntry."Document Type"::"Purchase Invoice");
        //lRecValueEntry.SetFilter("Invoiced Quantity", '>0');
        //lRecValueEntry.SetRange("Document No.", PurchInvHdrNo);
        //if lRecValueEntry.FindSet() then begin
        // REPEAT
        if (
            (ValueEntry."Invoiced Quantity" > 0) and
            (ItemLedgerEntry."Entry Type" = ItemLedgerEntry."Entry Type"::Purchase)
            ) then begin

            lrecSpotValueEntry.Init();
            lrecSpotValueEntry."Entry No." := lrecSpotValueEntry.FindNextEntryNo();

            //lrecItemLedger.Get(lRecValueEntry."Item Ledger Entry No.");
            lrecSpotValueEntry."Item Ledger Entry No." := ItemLedgerEntry."Entry No.";
            lrecSpotValueEntry."Item No." := ValueEntry."Item No.";
            lrecSpotValueEntry."Invoiced Quantity" := ValueEntry."Invoiced Quantity";
            lrecSpotValueEntry."Serial No." := ItemLedgerEntry."Serial No.";


            lrecSpotValueEntry."Value Entry No." := ValueEntry."Entry No.";

            if (ItemJournalLine."Source Currency Code" <> '') then
                lrecSpotValueEntry."Currency Code" := ItemJournalLine."Source Currency Code"
            else
                lrecSpotValueEntry."Currency Code" := ItemLedgerEntry."Shortcut Dimension 4 Code";


            //lrecSpotValueEntry."Currency Factor" := PurchaseHeader."Currency Factor";            

            StartofWeek := CALCDATE('<-CW>', ItemLedgerEntry."Posting Date");

            lrecCurrExchRates.Reset();
            lrecCurrExchRates.SetRange("Starting Date");
            lrecCurrExchRates.SetRange("Currency Code", lrecSpotValueEntry."Currency Code");
            lrecCurrExchRates.SetAscending("Starting Date", true);
            if lrecCurrExchRates.FindLast() then begin
                lrecSpotValueEntry."Currency Factor" := lrecCurrExchRates.ExchangeRate(lrecCurrExchRates."Starting Date", lrecCurrExchRates."Currency Code");
                lrecSpotValueEntry."Currency Exch Rate Start Date" := lrecCurrExchRates."Starting Date";
                lrecSpotValueEntry."Spot Exchange Rate" := lrecCurrExchRates."Spot Exchange Rate" / lrecCurrExchRates."Spot Rel Exch. Rate Amount";
                lrecSpotValueEntry."System Exchange Rate" := lrecCurrExchRates."Exchange Rate Amount" / lrecCurrExchRates."Relational Exch. Rate Amount";
            end;

            //lRecPurchLine.Reset();
            //lRecPurchLine.SetRange("Document No.", PurchaseHeader."No.");
            //lRecPurchLine.SetRange("No.", lrecItemLedger."Item No.");
            //lRecPurchLine.SetRange(Type, lRecPurchLine.Type::Item);
            //if lRecPurchLine.FindFirst() then begin
            //  lrecSpotValueEntry."Cost Per Unit Foreign" := lRecPurchLine."Direct Unit Cost";
            //end;
            lrecSpotValueEntry."Cost Per Unit Foreign" := ValueEntry."Cost per Unit";

            if (ValueEntry."Cost Amount (Actual)" <> 0) then
                lrecSpotValueEntry."Cost Amount(Actual)" := ValueEntry."Cost Amount (Actual)"
            else
                lrecSpotValueEntry."Cost Amount(Actual)" := ItemJournalLine."Unit Cost";

            lrecSpotValueEntry."Cost Per Unit Local" := ValueEntry."Cost per Unit";
            lrecSpotValueEntry."Entry Type" := ItemLedgerEntry."Entry Type";
            lrecSpotValueEntry."Document No." := ItemLedgerEntry."Document No.";
            lrecSpotValueEntry."Location Code" := ItemLedgerEntry."Location Code";
            //lrecSpotValueEntry."Purchase Invoice Document No." := PurchInvHdrNo;
            lrecSpotValueEntry.Insert();
            //  UNTIL lRecValueEntry.Next() = 0;
        end;
    end;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Purch.-Post (Yes/No)", 'OnBeforeConfirmPost', '', false, false)]
    local procedure OnBeforeConfirmPost(var PurchaseHeader: Record "Purchase Header"; var HideDialog: Boolean; var IsHandled: Boolean; var DefaultOption: Integer);
    begin
        DefaultOption := 1;
    end;

    /*
        [EventSubscriber(ObjectType::Codeunit, Codeunit::"Purch.-Post", 'OnAfterPostPurchaseDoc', '', false, false)]
        local procedure OnAfterPostPurchaseDoc(
            var PurchaseHeader: Record "Purchase Header";
            var GenJnlPostLine: Codeunit "Gen. Jnl.-Post Line";
            PurchRcpHdrNo: Code[20];
            RetShptHdrNo: Code[20];
            PurchInvHdrNo: Code[20];
            PurchCrMemoHdrNo: Code[20];
            CommitIsSupressed: Boolean);
        var
            lRecValueEntry: Record "Value Entry";
            lrecSpotValueEntry: Record "Purchase Invoice Exchange Rate";
            lrecItemLedger: Record "Item Ledger Entry";
            lrecCurrExchRates: Record "Currency Exchange Rate";
            StartofWeek: Date;
            lRecPurchLine: Record "Purchase Line";
        begin
            lRecValueEntry.Reset();
            lRecValueEntry.SetRange("Document Type", lRecValueEntry."Document Type"::"Purchase Invoice");
            lRecValueEntry.SetFilter("Invoiced Quantity", '>0');
            lRecValueEntry.SetRange("Document No.", PurchInvHdrNo);
            if lRecValueEntry.FindSet() then begin
                REPEAT

                    lrecSpotValueEntry.Init();
                    lrecSpotValueEntry."Entry No." := lrecSpotValueEntry.FindNextEntryNo();
                    lrecItemLedger.Get(lRecValueEntry."Item Ledger Entry No.");
                    lrecSpotValueEntry."Item Ledger Entry No." := lRecValueEntry."Item Ledger Entry No.";
                    lrecSpotValueEntry."Item No." := lRecValueEntry."Item No.";
                    lrecSpotValueEntry."Invoiced Quantity" := lRecValueEntry."Invoiced Quantity";
                    lrecSpotValueEntry."Serial No." := lrecItemLedger."Serial No.";


                    lrecSpotValueEntry."Value Entry No." := lRecValueEntry."Entry No.";
                    lrecSpotValueEntry."Currency Code" := PurchaseHeader."Currency Code";
                    lrecSpotValueEntry."Currency Factor" := PurchaseHeader."Currency Factor";
                    StartofWeek := CALCDATE('<-CW>', lrecItemLedger."Posting Date");

                    lrecCurrExchRates.Reset();
                    lrecCurrExchRates.SetRange("Starting Date", StartofWeek, TODAY());
                    lrecCurrExchRates.SetAscending("Starting Date", true);
                    if lrecCurrExchRates.FindLast() then begin
                        lrecSpotValueEntry."Currency Exch Rate Start Date" := lrecCurrExchRates."Starting Date";
                        lrecSpotValueEntry."Spot Exchange Rate" := lrecCurrExchRates."Spot Exchange Rate" / lrecCurrExchRates."Spot Rel Exch. Rate Amount";
                        lrecSpotValueEntry."System Exchange Rate" := lrecCurrExchRates."Exchange Rate Amount" / lrecCurrExchRates."Relational Exch. Rate Amount";
                    end;

                    lRecPurchLine.Reset();
                    lRecPurchLine.SetRange("Document No.", PurchaseHeader."No.");
                    lRecPurchLine.SetRange("No.", lrecItemLedger."Item No.");
                    lRecPurchLine.SetRange(Type, lRecPurchLine.Type::Item);
                    if lRecPurchLine.FindFirst() then begin
                        lrecSpotValueEntry."Cost Per Unit Foreign" := lRecPurchLine."Direct Unit Cost";
                    end;
                    lrecSpotValueEntry."Cost Amount(Actual)" := lRecValueEntry."Cost Amount (Actual)";
                    lrecSpotValueEntry."Cost Per Unit Local" := lRecValueEntry."Cost per Unit";
                    lrecSpotValueEntry."Entry Type" := lrecItemLedger."Entry Type"::Purchase;
                    lrecSpotValueEntry."Document No." := PurchaseHeader."No.";
                    lrecSpotValueEntry."Purchase Invoice Document No." := PurchInvHdrNo;
                    lrecSpotValueEntry.Insert();
                UNTIL lRecValueEntry.Next() = 0;
            end;
        end;
        */
}
