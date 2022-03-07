/// <summary>
/// Page Item wish list (ID 50414).
/// </summary>
page 50414 "Item wish list"
{

    ApplicationArea = All;
    Caption = 'Item wish list';
    PageType = List;
    SourceTable = "Item Wish Line";
    UsageCategory = Lists;
    DelayedInsert = true;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Date"; Rec."Date")
                {
                    ToolTip = 'Specifies the value of the Date field.';
                    ApplicationArea = All;
                }
                field("Item No."; Rec."Item No.")
                {
                    ToolTip = 'Specifies the value of the Item No. field.';
                    ApplicationArea = All;
                }
                field(Comment; Rec.Comment)
                {
                    ToolTip = 'Specifies the value of the Comment field.';
                    ApplicationArea = All;
                }
            }
        }
    }

    /// <summary>
    /// SetCustomerNo.
    /// </summary>
    /// <param name="custCode">code[20].</param>
    procedure SetCustomerNo(custCode: code[20])
    begin
        gCustomerNo := custCode;
    end;

    trigger OnInsertRecord(BelowxRec: Boolean): Boolean
    begin
        Rec."Entry No." := Rec.GetNextEntryNo();
        Rec."Customer No." := gCustomerNo;
    end;

    trigger OnOpenPage()
    begin
        Rec.SetRange("Customer No.", gCustomerNo);
    end;



    var
        gCustomerNo: Code[20];
}
