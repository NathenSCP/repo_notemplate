page 50419 "RDV Inventory Allowance Rate"
{

    ApplicationArea = All;
    Caption = 'RDV Allowance - Rate';
    PageType = List;
    SourceTable = "RDV Inventory Allowance Rate";
    UsageCategory = Administration;
    DelayedInsert = true;

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
                    Visible = false;
                }
                field(Year; Rec.Year)
                {
                    ToolTip = 'Specifies the value of the Year field.';
                    ApplicationArea = All;
                }
                field(Percentage; Rec.Percentage)
                {
                    ToolTip = 'Specifies the value of the Percentage field.';
                    ApplicationArea = All;
                }
            }
        }
    }

}
