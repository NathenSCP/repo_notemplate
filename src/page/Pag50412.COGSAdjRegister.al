/// <summary>
/// Page COGS Adj Register (ID 50412).
/// </summary>
page 50412 "COGS Adj Register"
{

    ApplicationArea = All;
    Caption = 'COGS Adj Register';
    PageType = List;
    SourceTable = "COGS Exc Rate Adj Registers";
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
            }
        }
    }

}
