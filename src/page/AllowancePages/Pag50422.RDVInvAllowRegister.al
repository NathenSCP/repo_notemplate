page 50422 "RDV Inv Allow Register"
{

    ApplicationArea = All;
    Caption = 'RDV Allowance - Register';
    PageType = List;
    SourceTable = "RDV Inv Allow Register";
    UsageCategory = Administration;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Entry No."; Rec."Entry No.")
                {
                    ToolTip = 'Specifies the value of the Entry No. field.';
                    ApplicationArea = All;
                }
                field("Creation Date"; Rec."Creation Date")
                {
                    ToolTip = 'Specifies the value of the Creation Date field.';
                    ApplicationArea = All;
                }
                field("Document No."; Rec."Document No.")
                {
                    ToolTip = 'Specifies the value of the Document No. field.';
                    ApplicationArea = All;
                }
                field("Allow Amount"; Rec."Allow Amount")
                {
                    ToolTip = 'Specifies the value of the Allow Amount field.';
                    ApplicationArea = All;
                }
            }
        }
    }

}
