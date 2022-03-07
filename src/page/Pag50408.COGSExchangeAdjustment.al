page 50408 "COGS Exchange Adjustment"
{
    Editable = true;
    PageType = Worksheet;
    Permissions = TableData "Item Location Variant Buffer 3" = rimd;
    SourceTable = "Item Location Variant Buffer 3";
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'COGS Exchange Adjustment';


    layout
    {
        area(content)
        {

            field(StartDate; StartDate)
            {
                ApplicationArea = All;
                Caption = 'From Date';
            }

            field("Ending Date"; AsOfDate)
            {
                Caption = 'To Date';
                ApplicationArea = All;

                trigger OnValidate()
                begin

                    if "AsOfDate" < StartDate then
                        Error('Please check From and to date');

                    //Rec.SetFilter("Remaining Quantity", '>0');
                    //CurrPage.UPDATE();
                end;
            }
            repeater(Group)
            {
                Editable = false;
                Enabled = true;
                field("Entry No."; Rec."Entry No.")
                {
                    Caption = 'ILE Entry No';
                    ApplicationArea = All;
                }
                field("ILE Posting Date"; Rec."ILE Posting Date")
                {
                    ApplicationArea = All;
                }

                field("ILE Doc No."; Rec."ILE Doc No.")
                {
                    ApplicationArea = All;
                }

                field("Item No."; Rec."Item No.")
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
                    Caption = 'ILE Qty';
                    ApplicationArea = All;

                }

                field("Serial No."; Rec."Serial No.")
                {
                    ApplicationArea = All;
                }

                field("Currency Code"; Rec."Currency Code")
                {
                    ApplicationArea = All;
                }
                field("Purchase Invoice Unit Price"; Rec."Purchase Invoice Unit Price")
                {
                    ApplicationArea = All;
                }
                field("Purch Inv Total Price USD"; Rec."Purch Inv Total Price USD")
                {
                    ApplicationArea = All;
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
                    Visible = false;
                }


                field("Remaining Quantity"; Rec."Remaining Quantity")
                {
                    ApplicationArea = All;
                    Visible = false;
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

            action(ActionName1)
            {
                ApplicationArea = All;
                Caption = 'Calculate Ex-Rate Adjustment', comment = 'NLB="YourLanguageCaption"';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = Calculate;
                trigger OnAction()
                var
                    ILERecord: record "Item Ledger Entry";
                begin
                    DeleteBufferTableData();
                    ClearLastEntry();
                    ILERecord.Reset;
                    //ILERecord.SetRange("Item No.", '1900-S');
                    ILERecord.SetRange("Posting Date", StartDate, AsOfDate);
                    ILERecord.SetRange("Entry Type", ILERecord."Entry Type"::Sale);
                    //ILERecord.SetRange("Item No.", 'ROL114200-0019');

                    //ILERecord.SetRange("Entry No.", 651);

                    if ILERecord.FindSet then
                        TotalExRateAdj := 0;
                    repeat

                        AdjustItemLedgEntryToAsOfDate(ILERecord);
                        if ((ILERecord."Invoiced Quantity" <> 0) and (ILERecord."Cost Amount (Actual)" <> 0)) then
                            UpdateBuffer(ILERecord);
                    until ILERecord.Next = 0;
                end;
            }
            action(ActionName)
            {
                ApplicationArea = All;
                Caption = 'Post COGS Exchange Adjustment', comment = 'NLB="Post"';
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
                    if Dialog.Confirm('Are you sure you want to post COGS exchange adjustment?') then begin

                        lAction := p.RunModal();
                        case lAction of
                            action::OK, action::LookupOK:
                                begin
                                    //Message('sdf');
                                    GLEntry := cu.PostGeneralJournalForExINVCOGS(Rec, p.GetNewDate(), TotalExRateAdj);
                                    if (GLEntry > 0) then begin
                                        Message('All entries posted successfully!');
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

        StartDate: Date;
        Grouping: Boolean;
        LastItemNo: Code[20];
        LastLocationCode: Code[10];
        LastVariantCode: Code[10];
        TempEntryBuffer: Record "Item Location Variant Buffer 3" temporary;
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
        //ILERecord: Record "Item Ledger Entry";
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
        purchInvoiceExcRate: Record "Purchase Invoice Exchange Rate";
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

        // calculate other things
        /*
                    ForeignCostAmount := 0;

                    purchInvoiceNo := '@@@';

                    ValueEntry.Reset;
                    ValueEntry.SetRange("Item Ledger Entry No.", "Entry No.");
                    ValueEntry.SetFilter("Invoiced Quantity", '>%1', 0);

                    if ValueEntry.FindLast then begin

                        purchInvoiceExcRate.Reset();
                        purchInvoiceExcRate.SetRange("Value Entry No.", ValueEntry."Entry No.");

                        if purchInvoiceExcRate.FindFirst() then begin
                            PurchInvExcRate_CostAmt := purchInvoiceExcRate."Cost Amount(Actual)";
                            PurchInvExcRate_CurrFac := purchInvoiceExcRate."Currency Factor";
                            PurchInvExcRate_SpotExchRate := purchInvoiceExcRate."Spot Exchange Rate";
                            SerialNo := purchInvoiceExcRate."Serial No.";
                        end;

                        PurchInvHdr.Reset;
                        PurchInvHdr.SetRange("No.", ValueEntry."Document No.");

                        if PurchInvHdr.FindFirst then begin

                            purchInvoiceNo := PurchInvHdr."No.";
                            VENo := ValueEntry."Entry No.";
                            purchInvoiceCurrCode := PurchInvHdr."Currency Code";
                            purchInvoiceCurrFact := Round(PurchInvHdr."Currency Factor", 0.00001, '=');

                            t330.Reset;
                            t330.SetRange("Currency Code", PurchInvHdr."Currency Code");
                            t330.SetRange("Starting Date", 0D, AsOfDate);

                            if t330.FindLast then begin
                                currFac := Round(t330."Exchange Rate Amount" / t330."Relational Exch. Rate Amount", 0.00001, '=');
                                currFactAsOfDate := ROUND(currFac, 0.00001, '=');

                            end;

                            lineCostAmount := "Cost Amount (Actual)";
                            if PurchInvHdr."Currency Factor" = 0 then begin
                                ForeignCostAmount := 1 * "Cost Amount (Actual)";
                            end
                            else begin
                                ForeignCostAmount := ROUND(PurchInvHdr."Currency Factor" * "Cost Amount (Actual)");
                            end;

                            if currFac = 0 then currFac := 1;

                            //currFac := ROUND(currFac, 0.00001, '=');
                            NewCADCostAmount := ROUND(ForeignCostAmount / currFac);

                        end
                    end */
        //end;


    end;

    procedure UpdateBuffer(var ItemLedgEntry: Record "Item Ledger Entry")
    var
        NewRow: Boolean;
        purchInvoiceExcRate: Record "Purchase Invoice Exchange Rate";
    begin

        if (ItemLedgEntry."Cost Amount (Actual)" <> 0) then begin

            if ((ItemLedgEntry."Item No." <> LastItemNo) or (ItemLedgEntry."Entry No." <> LastEntryNo)) then begin
                ClearLastEntry;
                LastItemNo := ItemLedgEntry."Item No.";
                LastEntryNo := ItemLedgEntry."Entry No.";
                NewRow := true
            end;

            PurchInvExcRate_CostAmt := 0;
            PurchInvExcRate_CurrFac := 0;
            PurchInvExcRate_SpotExchRate := 0;
            PurchInvExcRate_CostAmt_USD := 0;
            SerialNo := '';

            /*
                    if ShowVariants or ShowLocations then begin
                        if ItemLedgEntry."Variant Code" <> LastVariantCode then begin
                            NewRow := true;
                            LastVariantCode := ItemLedgEntry."Variant Code";
                            if ShowVariants then begin
                                if (ItemLedgEntry."Variant Code" = '') or not ItemVariant.Get(ItemLedgEntry."Item No.", ItemLedgEntry."Variant Code") then
                                    VariantLabel := Text007
                                else
                                    VariantLabel := ItemVariant.TableCaption + ' ' + ItemLedgEntry."Variant Code" + '(' + ItemVariant.Description + ')';
                            end
                            else
                                VariantLabel := ''
                        end;
                        if ItemLedgEntry."Location Code" <> LastLocationCode then begin
                            NewRow := true;
                            LastLocationCode := ItemLedgEntry."Location Code";
                            if ShowLocations then begin
                                if (ItemLedgEntry."Location Code" = '') or not Location.Get(ItemLedgEntry."Location Code") then
                                    LocationLabel := Text008
                                else
                                    LocationLabel := Location.TableCaption + ' ' + ItemLedgEntry."Location Code" + '(' + Location.Name + ')';
                            end
                            else
                                LocationLabel := '';
                        end
                    end;
                    */

            // diff := ROUND(lineCostAmount - NewCADCostAmount);
            // diffQOH := ROUND((diff / ItemLedgEntry.Quantity) * ItemLedgEntry."Remaining Quantity");

            TempEntryBuffer."Entry No." := ItemLedgEntry."Entry No.";
            TempEntryBuffer."ILE Posting Date" := ItemLedgEntry."Posting Date";
            // TempEntryBuffer."Value Entry No." := "Value Entry No.";
            TempEntryBuffer.Value11 := (-1) * ItemLedgEntry.Quantity; // ILE Qty
                                                                      // TempEntryBuffer.Value10 := diff; // diff
                                                                      //  TempEntryBuffer.Value9 := diffQOH; //diff qoh
                                                                      // TempEntryBuffer.Value8 := NewCADCostAmount; // new cad cost amount
                                                                      //  TempEntryBuffer.Value7 := ForeignCostAmount;  //foreign cost amount
                                                                      //  TempEntryBuffer."Value Entry No." := VENo;
                                                                      //  TempEntryBuffer."Purchase Invoice No." := purchInvoiceNo;
                                                                      // TempEntryBuffer."Purhcase Invoice Currency Fact" := purchInvoiceCurrFact;
                                                                      //  TempEntryBuffer."Currency Exch Rate As of Date" := currFactAsOfDate;
                                                                      // TempEntryBuffer."Purchase Invoice Curr Code" := purchInvoiceCurrCode;

            TempEntryBuffer."Remaining Quantity" := ItemLedgEntry."Remaining Quantity";
            if ShowACY then
                TempEntryBuffer.Value1 := ItemLedgEntry."Cost Amount (Actual) (ACY)"
            else
                TempEntryBuffer.Value1 := ItemLedgEntry."Cost Amount (Actual)";


            TempEntryBuffer."Item No." := ItemLedgEntry."Item No.";
            //  TempEntryBuffer."Variant Code" := LastVariantCode;
            TempEntryBuffer."Location Code" := ItemLedgEntry."Location Code";
            //  TempEntryBuffer.Label := 'VE#(' + Format(VENo) + ')PIV#' + purchInvoiceNo;//COPYSTR(VariantLabel + ' ' + LocationLabel,1,MAXSTRLEN(TempEntryBuffer.Label));
            // TempEntryBuffer.Value2 := lineCostAmount;
            IsCollecting := true;


            purchInvoiceExcRate.Reset();
            purchInvoiceExcRate.SetRange("Item No.", ItemLedgEntry."Item No.");
            purchInvoiceExcRate.SetRange("Location Code", ItemLedgEntry."Location Code");
            purchInvoiceExcRate.SetRange("Serial No.", ItemLedgEntry."Serial No.");

            if purchInvoiceExcRate.FindFirst() then begin
                PurchInvExcRate_CostAmt := (-1) * purchInvoiceExcRate."Cost Amount(Actual)";
                PurchInvExcRate_CurrFac := purchInvoiceExcRate."Currency Factor";
                PurchInvExcRate_SpotExchRate := purchInvoiceExcRate."Spot Exchange Rate";
                PurchInvExcRate_CostAmt_USD := PurchInvExcRate_CostAmt * PurchInvExcRate_CurrFac;
                SerialNo := purchInvoiceExcRate."Serial No.";

                TempEntryBuffer."Serial No." := SerialNo;
                TempEntryBuffer."ILE Doc No." := ItemLedgEntry."Document No.";
                TempEntryBuffer."Currency Code" := purchInvoiceExcRate."Currency Code";
                TempEntryBuffer."Purchase Invoice Total Price" := PurchInvExcRate_CostAmt;
                TempEntryBuffer."Purch Inv Total Price USD" := PurchInvExcRate_CostAmt_USD;
                TempEntryBuffer."Purchase Invoice Unit Price" := PurchInvExcRate_CostAmt / ((-1) * ItemLedgEntry."Invoiced Quantity");
                TempEntryBuffer."Purchase Invoice Exch Rate" := PurchInvExcRate_CurrFac;
                TempEntryBuffer."Spot Exch Rate" := PurchInvExcRate_SpotExchRate;

                if ((PurchInvExcRate_SpotExchRate <> 0) and (PurchInvExcRate_CurrFac <> 0)) then
                    TempEntryBuffer."Exchange Adjustment Amount" :=
                       (ItemLedgEntry."Quantity" * TempEntryBuffer."Purch Inv Total Price USD" *
                       ((1 / PurchInvExcRate_SpotExchRate) - (1 / PurchInvExcRate_CurrFac)));

                TotalExRateAdj := TotalExRateAdj + TempEntryBuffer."Exchange Adjustment Amount";
            end;

            if NewRow then //and (purchInvoiceExcRate."Entry No." > 0) and (TempEntryBuffer."Exchange Adjustment Amount" > 0) and (purchInvoiceExcRate."Sales Posted" = false) then
                UpdateTempEntryBuffer;
            //Rec.Copy(TempEntryBuffer);
            //Rec.Insert();

        end;
    end;

    /// <summary>
    /// ClearLastEntry.
    /// </summary>
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
        temptable: Record "Item Location Variant Buffer 3";
    begin
        temptable.Reset();
        temptable.DeleteAll();
        Commit();
    end;
}



