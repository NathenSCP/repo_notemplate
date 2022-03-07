page 50400 "SCP GCI Tracking"
{

    //ApplicationArea = All;
    Caption = 'GIA/Serial No.';
    PageType = Worksheet;
    SourceTable = "SCP Gci Tracking";
    UsageCategory = Administration;
    //SourceTableTemporary = true;


    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Serial No."; Rec."Serial No.")
                {
                    ApplicationArea = All;
                    Editable = false;
                }

                field("GCI No."; Rec."GIA No.")
                {
                    Caption = 'GIA/Serial No.';
                    ApplicationArea = All;
                    Editable = true;
                }
            }
        }
    }

    trigger OnNewRecord(BelowxRec: Boolean)
    begin
        Rec."Serial No." := gSerialNo;
        Rec."Item No." := gItemNo;
        Rec."Tracking Spec Entry No." := gItemTrackingTrackingEntryNo;
        Rec."Entry No." := Rec.GetEntryNo() + 1;
        //CurrPage.Update();
    end;

    procedure FillTable(var tempTable: record "SCP Gci Tracking")
    begin

    end;

    procedure SetGlobalSerialNo(inSerialNo: code[50]; inItem: Code[20]; inItemTrackingEntryNo: Integer)
    begin
        gSerialNo := inSerialNo;
        gItemNo := inItem;
        gItemTrackingTrackingEntryNo := inItemTrackingEntryNo
    end;

    var
        gSerialNo: Code[50];
        gItemNo: code[20];

        gItemTrackingTrackingEntryNo: Integer;

}
