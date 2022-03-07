page 50421 "RDV Inv Allow Dtl Led Entry"
{
    
    ApplicationArea = All;
    Caption = 'RDV Inv Allow Dtl Led Entry';
    PageType = List;
    SourceTable = "RDV Inv All Detail Led Entry";
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
                field("Item Led Entry No."; Rec."Item Led Entry No.")
                {
                    ToolTip = 'Specifies the value of the Item Led Entry No. field.';
                    ApplicationArea = All;
                }
                field("Posting Date"; Rec."Posting Date")
                {
                    ToolTip = 'Specifies the value of the Posting Date field.';
                    ApplicationArea = All;
                }
                field("Entry Type"; Rec."Entry Type")
                {
                    ToolTip = 'Specifies the value of the Entry Type field.';
                    ApplicationArea = All;
                }
                field("Allowance Amt"; Rec."Allowance Amt")
                {
                    ToolTip = 'Specifies the value of the Allowance Amt field.';
                    ApplicationArea = All;
                }
            }
        }
    }
    
}
