page 50402 "Inventory Exc Rate Adju"
{
    Editable = true;
    PageType = Worksheet;
    Permissions = TableData "Item Location Variant Buffer 2" = rimd;
    SourceTable = "Item Location Variant Buffer 2";
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'Inventory Exchange Rate Adjustment';


    layout
    {
        area(content)
        {
            field(AsOfDate; AsOfDate)
            {
                Caption = 'As of Date';
                ApplicationArea = All;

                trigger OnValidate()
                begin

                    DeleteBufferTableData();
                    ClearLastEntry();
                    CurrPage.Update();

                    ILERecord.Reset;
                    //ILERecord.SetRange("Item No.", '1900-S');
                    ILERecord.SetRange("Posting Date", 0D, AsOfDate);
                    ILERecord.SetRange("Entry Type", ILERecord."Entry Type"::Purchase);
                    ILERecord.SetRange(Positive, true);
                    //ILERecord.SetRange("Entry No.", 651);

                    if ILERecord.FindSet then
                        TotalExRateAdj := 0;
                    repeat
                        AdjustItemLedgEntryToAsOfDate(ILERecord);
                        if (ILERecord."Remaining Quantity" > 0) then
                            UpdateBuffer(ILERecord);
                    until ILERecord.Next = 0;
                    Rec.SetFilter("Remaining Quantity", '>0');
                    //CurrPage.UPDATE();
                end;
            }
            repeater(Group)
            {
                Editable = false;
                Enabled = true;
                field("Entry No."; Rec."Entry No.")
                {
                    Caption = 'Item Ledger Entry No.';
                    ApplicationArea = All;
                }
                field("ILE Posting Date"; Rec."ILE Posting Date")
                {
                    ApplicationArea = All;
                    Caption = 'Item Ledger Posting Date';
                }
                field("ILE Doc No."; Rec."ILE Doc No.")
                {
                    ApplicationArea = All;
                    Caption = 'Item Ledger Entry Document No';

                }

                field("Item No."; Rec."Item No.")
                {
                    ApplicationArea = All;
                }

                field("Serial No."; Rec."Serial No.")
                {
                    ApplicationArea = All;
                }

                field("Location Code"; Rec."Location Code")
                {
                    ApplicationArea = All;
                    Visible = true;
                }

                field(Value11; Rec.Value11)
                {
                    Caption = 'Quantity';
                    ApplicationArea = All;
                }

                field("Remaining Quantity"; Rec."Remaining Quantity")
                {
                    ApplicationArea = All;
                }

                field("Purchase Invoice Total Price"; Rec."Purchase Invoice Total Price")
                {
                    ApplicationArea = All;
                }
                field("PurchInvExcRate_CostAmt_USD"; Rec."Purch Invoice Total Price USD")
                {
                    ApplicationArea = All;
                    caption = 'Purchase Invoice Total Price USD';
                }

                field("Purchase Invoice Exchange Rate"; Rec."Purchase Invoice Exch Rate")
                {
                    ApplicationArea = All;
                }
                field("Spot Exchange Rate"; Rec."Spot Exch Rate")
                {
                    ApplicationArea = All;
                }
                field("Exchange Adjustment Amount"; Rec."Exchange Adjustment Amount")
                {
                    ApplicationArea = All;
                }
                field("Value Entry No."; Rec."Value Entry No.")
                {
                    ApplicationArea = All;
                }

                /*
                field("Purchase Invoice No."; Rec."Purchase Invoice No.")
                {
                    ApplicationArea = All;
                }
                field("Purhcase Invoice Currency Fact"; Rec."Purhcase Invoice Currency Fact")
                {
                    ApplicationArea = All;
                    DecimalPlaces = 1 : 6;
                    MinValue = 0;
                }
                field("Currency Exch Rate As of Date"; Rec."Currency Exch Rate As of Date")
                {
                    ApplicationArea = All;
                    DecimalPlaces = 1 : 6;
                    MinValue = 0;
                }
                field("Purchase Invoice Curr Code"; Rec."Purchase Invoice Curr Code")
                {
                    ApplicationArea = All;
                }
                field("Variant Code"; Rec."Variant Code")
                {
                    ApplicationArea = All;
                    Visible = false;
                }
                field(Value1; Rec.Value1)
                {
                    //Caption = 'Purchase Invoice Inventory value';
                    Caption = 'Old canadian cost amount';
                    ApplicationArea = All;
                    Visible = false;
                }
                field(Value2; Rec.Value2)
                {
                    ApplicationArea = All;
                    Visible = false;

                }
                field(Value3; Rec.Value3)
                {
                    ApplicationArea = All;
                    Visible = false;
                }
                field(Value4; Rec.Value4)
                {
                    ApplicationArea = All;
                    Visible = false;
                }
                field(Value5; Rec.Value5)
                {
                    ApplicationArea = All;
                    Visible = false;
                }
                field(Value6; Rec.Value6)
                {
                    ApplicationArea = All;
                    Visible = false;
                }
                field(Value7; Rec.Value7)
                {
                    Caption = 'ForeignCostAmount';
                    ApplicationArea = All;
                }
                field(Value8; Rec.Value8)
                {
                    Caption = 'New canadian cost amount';
                    ApplicationArea = All;
                    Visible = false;
                }
                field(Value9; Rec.Value9)
                {
                    Caption = 'diffQOH';
                    ApplicationArea = All;
                    Visible = false;
                }
                field(Value10; Rec.Value10)
                {
                    Caption = 'diff';
                    ApplicationArea = All;
                    Visible = false;
                }
                */
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(ActionName)
            {
                ApplicationArea = All;
                Caption = 'Post Exchange Adjustment', comment = 'NLB="Post"';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = Post;


                trigger OnAction()
                var
                    p: Page "PostingDateDialog";
                    lAction: Action;
                    cu: Codeunit "ExINV Post Util";
                    GLEntry: Integer;
                begin
                    if Dialog.Confirm('Are you sure you want to post exchange adjustment?') then begin

                        lAction := p.RunModal();
                        case lAction of
                            action::OK, action::LookupOK:
                                begin
                                    //Message('sdf');
                                    GLEntry := cu.PostGeneralJournalForExINV(Rec, p.GetNewDate(), TotalExRateAdj);
                                    //cu.TransferToPosted(Rec, 20211025D, 'dd001');
                                    if (GLEntry > 0) then begin
                                        Message('All Entries posted successfully!');
                                    end
                                    else begin
                                        Error('Error while posting');
                                    end;

                                    Rec.DeleteAll();
                                    Commit();
                                    CurrPage.Update();
                                end;
                        end;
                    end;
                end;
            }

            action(Temp)
            {
                ApplicationArea = All;
                Caption = 'Temp';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = PostBatch;
                Visible = false;
                trigger OnAction()
                var
                    CurrExc: Record "Currency Exchange Rate";
                    i:
                                Integer;
                begin
                    CurrExc.Reset();
                    CurrExc.SetRange("Currency Code", 'USD');
                    i := 1;
                    if CurrExc.FindSet() then
                        repeat

                            CurrExc."Spot Exchange Rate" := 100;
                            CurrExc."Spot Rel Exch. Rate Amount" := 125 + i;
                            i := 1 + i;
                            CurrExc.Modify();
                        until CurrExc.Next() = 0;
                end;
            }
        }


    }

    trigger OnOpenPage()
    begin

        ClearLastEntry();
        DeleteBufferTableData();

        //SetFilter("Remaining Quantity" > 0);
        //AsOfDate := WORKDATE;
        //ILERecord.RESET;
        //ILERecord.SETRANGE("Posting Date",0D,AsOfDate);
    end;

    var
        GLSetup: Record "General Ledger Setup";
        CompanyInformation: Record "Company Information";
        InvPostingGroup: Record "Inventory Posting Group";
        Currency: Record Currency;
        Location: Record Location;
        ItemVariant: Record "Item Variant";
        ItemFilter: Text;
        ShowVariants: Boolean;
        ShowLocations: Boolean;
        ShowACY: Boolean;
        AsOfDate: Date;
        Grouping: Boolean;
        LastItemNo: Code[20];
        LastLocationCode: Code[10];
        LastVariantCode: Code[10];
        TempEntryBuffer: Record "Item Location Variant Buffer 2" temporary;
        VariantLabel: Text[250];
        LocationLabel: Text[250];
        IsCollecting: Boolean;
        Progress: Dialog;
        LastEntryNo: Integer;
        ForeignCostAmount: Decimal;
        NewCADCostAmount: Decimal;
        diff: Decimal;
        diffQOH: Decimal;
        purchInvoiceNo: Code[10];
        VENo: Integer;
        ILERecord: Record "Item Ledger Entry";
        Text000: Label 'You must enter an As Of Date.';
        Text001: Label 'If you want to show Locations without also showing Variants, you must add a new key to the %1 table which starts with the %2 and %3 fields.';
        Text002: Label 'Do not set a %1 on the %2.  Use the As Of Date on the Option tab instead.';
        Text003: Label 'Quantities and Values As Of %1';
        Text004: Label '%1 %2 (%3)';
        Text005: Label '%1 %2 (%3) Total';
        Text006: Label 'All Inventory Values are shown in %1.';
        Text007: Label 'No Variant';
        Text008: Label 'No Location';
        Inventory_ValuationCaptionLbl: Label 'Inventory Valuation';
        CurrReport_PAGENOCaptionLbl: Label 'Page';
        InventoryValue_Control34CaptionLbl: Label 'Inventory Value';
        UnitCost_Control33CaptionLbl: Label 'Unit Cost';
        Total_Inventory_ValueCaptionLbl: Label 'Total Inventory Value';
        purchInvoiceCurrFact: Decimal;
        currFactAsOfDate: Decimal;
        purchInvoiceCurrCode: Code[10];
        Lbl001: Label 'As of Date';
        lineCostAmount: Decimal;

        PurchInvExcRate_CostAmt: Decimal;

        PurchInvExcRate_CostAmt_USD: Decimal;

        PurchInvExcRate_CurrFac: Decimal;

        PurchInvExcRate_SpotExchRate: Decimal;

        SerialNo: Code[20];

        TotalExRateAdj: Decimal;

    local procedure AdjustItemLedgEntryToAsOfDate(var ItemLedgEntry: Record "Item Ledger Entry")
    var
        ItemApplnEntry: Record "Item Application Entry";
        ValueEntry: Record "Value Entry";
        ItemLedgEntry2: Record "Item Ledger Entry";
        PurchInvHdr: Record "Purch. Inv. Header";
        t330: Record "Currency Exchange Rate";
        currFac: Decimal;

    begin
        //with ItemLedgEntry do begin
        // adjust remaining quantity
        ItemLedgEntry."Remaining Quantity" := ItemLedgEntry.Quantity;
        if ItemLedgEntry.Positive then begin
            ItemApplnEntry.Reset;
            ItemApplnEntry.SetCurrentKey(
              "Inbound Item Entry No.", "Item Ledger Entry No.", "Outbound Item Entry No.", "Cost Application");
            ItemApplnEntry.SetRange("Inbound Item Entry No.", ItemLedgEntry."Entry No.");
            ItemApplnEntry.SetRange("Posting Date", 0D, AsOfDate);
            ItemApplnEntry.SetFilter("Outbound Item Entry No.", '<>%1', 0);
            ItemApplnEntry.SetFilter("Item Ledger Entry No.", '<>%1', ItemLedgEntry."Entry No.");
            ItemApplnEntry.CalcSums(Quantity);
            ItemLedgEntry."Remaining Quantity" += ItemApplnEntry.Quantity;
        end else begin
            ItemApplnEntry.Reset;
            ItemApplnEntry.SetCurrentKey(
              "Outbound Item Entry No.", "Item Ledger Entry No.", "Cost Application", "Transferred-from Entry No.");
            ItemApplnEntry.SetRange("Item Ledger Entry No.", ItemLedgEntry."Entry No.");
            ItemApplnEntry.SetRange("Outbound Item Entry No.", ItemLedgEntry."Entry No.");
            ItemApplnEntry.SetRange("Posting Date", 0D, AsOfDate);
            if ItemApplnEntry.Find('-') then
                repeat
                    if ItemLedgEntry2.Get(ItemApplnEntry."Inbound Item Entry No.") and
                       (ItemLedgEntry2."Posting Date" <= AsOfDate)
                    then
                        ItemLedgEntry."Remaining Quantity" := ItemLedgEntry."Remaining Quantity" - ItemApplnEntry.Quantity;
                until ItemApplnEntry.Next = 0;
        end;

        // calculate adjusted cost of entry
        ValueEntry.Reset;
        ValueEntry.SetRange("Item Ledger Entry No.", ItemLedgEntry."Entry No.");
        ValueEntry.SetRange("Posting Date", 0D, AsOfDate);
        ValueEntry.CalcSums(
          "Cost Amount (Expected)", "Cost Amount (Actual)", "Cost Amount (Expected) (ACY)", "Cost Amount (Actual) (ACY)");

        ItemLedgEntry."Cost Amount (Actual)" := Round(ValueEntry."Cost Amount (Actual)" + ValueEntry."Cost Amount (Expected)");

        ItemLedgEntry."Cost Amount (Actual) (ACY)" :=
          Round(
            ValueEntry."Cost Amount (Actual) (ACY)" + ValueEntry."Cost Amount (Expected) (ACY)", Currency."Amount Rounding Precision");
    end;

    procedure UpdateBuffer(var ItemLedgEntry: Record "Item Ledger Entry")
    var
        NewRow: Boolean;
        ValueEntry: Record "Value Entry";
        purchInvoiceExcRate: Record "Purchase Invoice Exchange Rate";
    begin
        if ((ItemLedgEntry."Item No." <> LastItemNo) or (ItemLedgEntry."Entry No." <> LastEntryNo)) then begin
            ClearLastEntry;
            LastItemNo := ItemLedgEntry."Item No.";
            LastEntryNo := ItemLedgEntry."Entry No.";
            NewRow := true
        end;

        PurchInvExcRate_CostAmt := 0;
        PurchInvExcRate_CurrFac := 0;
        PurchInvExcRate_CostAmt_USD := 0;
        PurchInvExcRate_SpotExchRate := 0;
        SerialNo := '';
        LastLocationCode := ItemLedgEntry."Location Code";

        ValueEntry.Reset;
        ValueEntry.SetRange("Item Ledger Entry No.", ItemLedgEntry."Entry No.");
        ValueEntry.SetFilter("Invoiced Quantity", '>%1', 0);

        if ValueEntry.FindLast then begin

            purchInvoiceExcRate.Reset();
            purchInvoiceExcRate.SetRange("Value Entry No.", ValueEntry."Entry No.");
            //purchInvoiceExcRate.SetRange("Purchase Posted", false);

            VENo := ValueEntry."Entry No.";
            if purchInvoiceExcRate.FindFirst() then begin
                PurchInvExcRate_CostAmt := Round(purchInvoiceExcRate."Cost Amount(Actual)", 0.000001, '=');
                PurchInvExcRate_CurrFac := Round(purchInvoiceExcRate."Currency Factor", 0.000001, '=');
                PurchInvExcRate_CostAmt_USD := Round(PurchInvExcRate_CostAmt * PurchInvExcRate_CurrFac, 0.000001, '=');
                PurchInvExcRate_SpotExchRate := Round(purchInvoiceExcRate."Spot Exchange Rate", 0.000001, '=');
                SerialNo := purchInvoiceExcRate."Serial No.";
            end;
        end;
        TempEntryBuffer."Entry No." := ItemLedgEntry."Entry No.";
        TempEntryBuffer."ILE Posting Date" := ItemLedgEntry."Posting Date";
        TempEntryBuffer.Value11 := ItemLedgEntry.Quantity; // ILE Qty
                                                           //  TempEntryBuffer.Value10 := diff; // diff
                                                           //   TempEntryBuffer.Value9 := diffQOH; //diff qoh
                                                           //   TempEntryBuffer.Value8 := NewCADCostAmount; // new cad cost amount
                                                           //   TempEntryBuffer.Value7 := ForeignCostAmount;  //foreign cost amount
        TempEntryBuffer."Value Entry No." := VENo;
        TempEntryBuffer."Purchase Invoice No." := purchInvoiceNo;
        TempEntryBuffer."Purhcase Invoice Currency Fact" := purchInvoiceCurrFact;
        TempEntryBuffer."Currency Exch Rate As of Date" := currFactAsOfDate;
        TempEntryBuffer."Purchase Invoice Curr Code" := purchInvoiceCurrCode;

        TempEntryBuffer."Remaining Quantity" := ItemLedgEntry."Remaining Quantity";
        if ShowACY then
            TempEntryBuffer.Value1 += ItemLedgEntry."Cost Amount (Actual) (ACY)"
        else
            TempEntryBuffer.Value1 += ItemLedgEntry."Cost Amount (Actual)";


        TempEntryBuffer."Item No." := ItemLedgEntry."Item No.";
        // TempEntryBuffer."Variant Code" := LastVariantCode;
        TempEntryBuffer."Location Code" := LastLocationCode;
        //  TempEntryBuffer.Label := 'VE#(' + Format(VENo) + ')PIV#' + purchInvoiceNo;//COPYSTR(VariantLabel + ' ' + LocationLabel,1,MAXSTRLEN(TempEntryBuffer.Label));
        //  TempEntryBuffer.Value2 := lineCostAmount;
        IsCollecting := true;

        TempEntryBuffer."Serial No." := SerialNo;
        TempEntryBuffer."ILE Doc No." := ItemLedgEntry."Document No.";

        if (PurchInvExcRate_SpotExchRate > 0) then begin

            TempEntryBuffer."Purchase Invoice Total Price" := PurchInvExcRate_CostAmt;
            TempEntryBuffer."Purchase Invoice Unit Price" := PurchInvExcRate_CostAmt / ItemLedgEntry.Quantity;
            TempEntryBuffer."Purchase Invoice Exch Rate" := PurchInvExcRate_CurrFac;
            TempEntryBuffer."Spot Exch Rate" := PurchInvExcRate_SpotExchRate;
            TempEntryBuffer."Purch Invoice Total Price USD" := PurchInvExcRate_CostAmt_USD;

            if ((PurchInvExcRate_SpotExchRate <> 0) and (PurchInvExcRate_CurrFac <> 0)) then
                TempEntryBuffer."Exchange Adjustment Amount" :=
                   (ItemLedgEntry."Remaining Quantity" * PurchInvExcRate_CostAmt_USD *
                   ((1 / PurchInvExcRate_SpotExchRate) - (1 / PurchInvExcRate_CurrFac)));

            TotalExRateAdj := TotalExRateAdj + TempEntryBuffer."Exchange Adjustment Amount";


        end;

        if NewRow then //and (purchInvoiceExcRate."Entry No." > 0) and (TempEntryBuffer."Exchange Adjustment Amount" > 0) and (purchInvoiceExcRate."Purchase Posted" = false) then
            UpdateTempEntryBuffer;
        //Rec.Copy(TempEntryBuffer);
        //Rec.Insert();

        //for debug


    end;

    procedure ClearLastEntry()
    begin
        LastItemNo := '@@@';
        LastLocationCode := '@@@';
        LastVariantCode := '@@@';
        LastEntryNo := 0;
    end;

    procedure UpdateTempEntryBuffer()
    begin
        if IsCollecting and ((TempEntryBuffer."Entry No." <> 0) or (TempEntryBuffer.Value1 <> 0)) then begin
            //TempEntryBuffer.INSERT;
            Rec.Copy(TempEntryBuffer);
            Rec.Insert();
            //CurrPage.UPDATE(TRUE);
            IsCollecting := false;
            Clear(TempEntryBuffer);
        end;
    end;

    local procedure DeleteBufferTableData()
    var
        temptable: Record "Item Location Variant Buffer 2";
    begin
        temptable.Reset();
        temptable.DeleteAll();
        Commit();
    end;
}


