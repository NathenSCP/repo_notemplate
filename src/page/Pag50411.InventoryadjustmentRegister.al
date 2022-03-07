/// <summary>
/// Page Inventory adjustment Register (ID 50411).
/// </summary>
page 50411 "Inventory adjustment Register"
{

    ApplicationArea = All;
    Caption = 'Inventory adjustment Register';
    PageType = List;
    SourceTable = "Inv Exc Rate Adj Registers";
    UsageCategory = Administration;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Document No."; Rec."Document No.")
                {
                    ToolTip = 'Specifies the value of the Document No. field.';
                    ApplicationArea = All;
                }
                field("Creation Date"; Rec."Creation Date")
                {
                    ToolTip = 'Specifies the value of the Creation Date field.';
                    ApplicationArea = All;
                }
                field(Amount; Rec.Amount)
                {
                    ToolTip = 'Specifies the value of the Amount field.';
                    ApplicationArea = All;
                }
                field(Reverse; Rec.Reverse)
                {
                    ToolTip = 'Specifies the value of the Reverse field.';
                    ApplicationArea = All;
                }
            }
        }
    }

}
