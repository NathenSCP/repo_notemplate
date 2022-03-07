page 50423 "RDV Inventory Allowance"
{
    Editable = true;
    PageType = Worksheet;
    Permissions = TableData "Item Location Variant Buffer 4" = rimd;
    SourceTable = "Item Location Variant Buffer 4";
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'RDV Allowance - Calculate';


    layout
    {
        area(content)
        {
            field(AsOfDate; AsOfDate)
            {
                Caption = 'As of Date';
                ApplicationArea = All;
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

                field(Value1; Rec.Value1)
                {
                    Caption = 'Cost Amount(Actual)';
                    ApplicationArea = All;
                }

                field("Total Allowance Amount"; Rec."Total Allowance Amount")
                {
                    Caption = 'Total Allowance Amount';
                    ApplicationArea = All;
                }

                field("New Total Allowance Amount"; Rec."New Total Allowance Amount")
                {
                    Caption = 'New Total Allowance Amount';
                    ApplicationArea = All;
                }
                field("New Additional Allowance"; Rec."New Add Allowance")
                {
                    ApplicationArea = All;
                }
                field("Allowance Rate Year"; Rec."Allowance Rate Year")
                {
                    ApplicationArea = All;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {

            action("Calculate Inventory")
            {
                ApplicationArea = All;
                Caption = 'Calculate Inventory', comment = 'NLB="Calculate Inventory"';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = Process;
                trigger OnAction()
                begin

                    DeleteBufferTableData();
                    ClearLastEntry();
                    CurrPage.Update();

                    ILERecord.Reset;
                    ILERecord.SetRange("Posting Date", 0D, AsOfDate);

                    if ILERecord.FindSet then
                        New_Total_Additional_Allowance_Amount := 0;
                    repeat
                        //ILERecord := GetCorrectILE(ILERecord);
                        AdjustItemLedgEntryToAsOfDate(ILERecord);
                        if (ILERecord."Remaining Quantity" > 0) then
                            UpdateBuffer(ILERecord);
                    until ILERecord.Next = 0;
                    Rec.SetFilter("Remaining Quantity", '>0');
                end;
            }
            action(ActionName)
            {
                ApplicationArea = All;
                Caption = 'Post Inventory Allowance';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = Post;


                trigger OnAction()
                var
                    p: Page "PostingDateDialog";
                    lAction: Action;
                    cu: Codeunit "Inventory Allowance CU";
                    GLEntry: Integer;
                begin
                    if New_Total_Additional_Allowance_Amount = 0 then
                        Error('Nothing to post !');

                    if Dialog.Confirm('Are you sure you want to post inventory allowance?') then begin
                        p.SetDate(AsOfDate);
                        lAction := p.RunModal();
                        case lAction of
                            action::OK, action::LookupOK:
                                begin
                                    //Message('sdf');
                                    GLEntry := cu.PostInventoryAllowance(Rec, p.GetNewDate(), New_Total_Additional_Allowance_Amount);
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
        TempEntryBuffer: Record "Item Location Variant Buffer 4" temporary;
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

        SerialNo: Code[20];

        //TotalExRateAdj: Decimal;

        Total_Allowance_Amount: Decimal;

        New_Total_Allowance_Amount: Decimal;

        Allowance_Rate_Year: Integer;

        New_Additional_Allowance_Amount: Decimal;
        New_Total_Additional_Allowance_Amount: Decimal;

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


        if ((ItemLedgEntry."Document Type" = ItemLedgEntry."Document Type"::"Sales Credit Memo") or
       (ItemLedgEntry."Document Type" = ItemLedgEntry."Document Type"::"Sales Return Receipt")) then begin
            SetCostAmountActual(ItemLedgEntry);
        end
        else begin
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
    end;

    procedure UpdateBuffer(var ItemLedgEntry: Record "Item Ledger Entry")
    var
        NewRow: Boolean;
        ValueEntry: Record "Value Entry";
        rdvInvAllRate: Record "RDV Inventory Allowance Rate";
        //purchInvoiceExcRate: Record "Purchase Invoice Exchange Rate";

        rdvInvAllLedEntry: Record "RDV Inv All Led Entry";

    begin
        if ((ItemLedgEntry."Item No." <> LastItemNo) or (ItemLedgEntry."Entry No." <> LastEntryNo)) then begin
            ClearLastEntry;
            LastItemNo := ItemLedgEntry."Item No.";
            LastEntryNo := ItemLedgEntry."Entry No.";
            NewRow := true
        end;

        SerialNo := '';
        Total_Allowance_Amount := 0;
        New_Total_Allowance_Amount := 0;
        New_Additional_Allowance_Amount := 0;
        Allowance_Rate_Year := 0;


        LastLocationCode := ItemLedgEntry."Location Code";


        TempEntryBuffer."Entry No." := ItemLedgEntry."Entry No.";
        TempEntryBuffer."ILE Posting Date" := ItemLedgEntry."Posting Date";
        TempEntryBuffer.Value11 := ItemLedgEntry.Quantity;
        TempEntryBuffer."Value Entry No." := VENo;
        TempEntryBuffer."Remaining Quantity" := ItemLedgEntry."Remaining Quantity";

        if ShowACY then
            TempEntryBuffer.Value1 += ItemLedgEntry."Cost Amount (Actual) (ACY)"
        else
            TempEntryBuffer.Value1 += ItemLedgEntry."Cost Amount (Actual)";


        rdvInvAllLedEntry.Reset();
        rdvInvAllLedEntry.SetRange("Item Ledger Entry No.", ItemLedgEntry."Entry No.");

        if rdvInvAllLedEntry.FindFirst() then begin
            rdvInvAllLedEntry.CalcFields("Allowance Amount");
            Total_Allowance_Amount := rdvInvAllLedEntry."Allowance Amount";
        end;
        rdvInvAllRate := GetAllowancePercentage(ItemLedgEntry);
        if (rdvInvAllRate.Percentage > 0) then
            New_Total_Allowance_Amount := TempEntryBuffer.Value1 * rdvInvAllRate.Percentage;

        New_Additional_Allowance_Amount := New_Total_Allowance_Amount - Total_Allowance_Amount;

        Allowance_Rate_Year := rdvInvAllRate.Year;

        TempEntryBuffer."Total Allowance Amount" := Total_Allowance_Amount;
        TempEntryBuffer."New Total Allowance Amount" := New_Total_Allowance_Amount;
        TempEntryBuffer."Allowance Rate Year" := Allowance_Rate_Year;
        TempEntryBuffer."New Add Allowance" := New_Additional_Allowance_Amount;

        TempEntryBuffer."Item No." := ItemLedgEntry."Item No.";

        TempEntryBuffer."Location Code" := LastLocationCode;

        IsCollecting := true;

        TempEntryBuffer."Serial No." := ItemLedgEntry."Serial No.";
        TempEntryBuffer."ILE Doc No." := ItemLedgEntry."Document No.";

        if NewRow then
            UpdateTempEntryBuffer;

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
            Rec.Copy(TempEntryBuffer);
            Rec.Insert();
            IsCollecting := false;
            Clear(TempEntryBuffer);

            New_Total_Additional_Allowance_Amount := New_Total_Additional_Allowance_Amount + New_Additional_Allowance_Amount;
        end;
    end;

    local procedure DeleteBufferTableData()
    var
        temptable: Record "Item Location Variant Buffer 4";
    begin
        temptable.Reset();
        temptable.DeleteAll();
        Commit();
    end;

    local procedure GetCorrectILE(ILE: Record "Item Ledger Entry"): Record "Item Ledger Entry"
    var
        Ilenew: Record "Item Ledger Entry";
    begin
        if ((ILE."Document Type" = ILE."Document Type"::"Sales Credit Memo") or
        (ILE."Document Type" = ILE."Document Type"::"Sales Return Receipt")) then begin
            Ilenew.Reset();
            Ilenew.SetRange("Serial No.", ILE."Serial No.");
            Ilenew.SetRange("Item No.", ile."Item No.");
            Ilenew.SetCurrentKey("Entry No.");
            Ilenew.SetAscending("Entry No.", true);
            if Ilenew.FindFirst() then
                exit(Ilenew);
        end
        else
            exit(ILE);

    end;

    local procedure SetCostAmountActual(var ItemLedgEntry: Record "Item Ledger Entry"): Decimal
    var
        ValueEntry: Record "Value Entry";
        ItemLedgEntry2: Record "Item Ledger Entry";
    begin

        ItemLedgEntry2.Reset();
        ItemLedgEntry2.SetRange("Serial No.", ItemLedgEntry."Serial No.");
        ItemLedgEntry2.SetRange("Item No.", ItemLedgEntry."Item No.");
        ItemLedgEntry2.SetCurrentKey("Entry No.");
        ItemLedgEntry2.SetAscending("Entry No.", true);
        if ItemLedgEntry2.FindFirst() then begin

            ItemLedgEntry."Posting Date" := ItemLedgEntry2."Posting Date";
            // ItemLedgEntry."Entry No." := ItemLedgEntry2."Entry No.";
            ValueEntry.Reset;
            ValueEntry.SetRange("Item Ledger Entry No.", ItemLedgEntry2."Entry No.");
            ValueEntry.SetRange("Posting Date", 0D, AsOfDate);
            ValueEntry.CalcSums(
              "Cost Amount (Expected)", "Cost Amount (Actual)", "Cost Amount (Expected) (ACY)", "Cost Amount (Actual) (ACY)");

            ItemLedgEntry."Cost Amount (Actual)" := Round(ValueEntry."Cost Amount (Actual)" + ValueEntry."Cost Amount (Expected)");

            ItemLedgEntry."Cost Amount (Actual) (ACY)" :=
              Round(
                ValueEntry."Cost Amount (Actual) (ACY)" + ValueEntry."Cost Amount (Expected) (ACY)", Currency."Amount Rounding Precision");
        end;
    end;

    local procedure GetAllowancePercentage(ILE: Record "Item Ledger Entry"): Record "RDV Inventory Allowance Rate"
    var
        rdvAllowanceRate: Record "RDV Inventory Allowance Rate";
        ILEYear: Integer;
        asofDateYear: Integer;
        yearToCalc: Integer;
    begin
        ILEYear := Date2dmy(ILE."Posting Date", 3);
        asofDateYear := Date2dmy(AsOfDate, 3);

        yearToCalc := Abs((asofDateYear - ILEYear) + 1);
        rdvAllowanceRate.Reset();
        rdvAllowanceRate.SetFilter(Year, '<=%1', yearToCalc);
        rdvAllowanceRate.SetCurrentKey(Year);
        rdvAllowanceRate.SetAscending(Year, false);
        if rdvAllowanceRate.FindFirst() then begin
            exit(rdvAllowanceRate);
        end;
    end;
}


