page 50409 "Posted COGS Exch Adj List"
{

    ApplicationArea = All;
    Caption = 'Posted COGS Exch Adj List';
    PageType = List;
    SourceTable = "Posted COGS Exch Adj";
    UsageCategory = Administration;
    Editable = false;

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
                field("ILE Entry No."; Rec."ILE Entry No.")
                {
                    ToolTip = 'Specifies the value of the ILE Entry No. field.';
                    ApplicationArea = All;
                }
                field("ILE Posting Date"; Rec."ILE Posting Date")
                {
                    ToolTip = 'Specifies the value of the ILE Posting Date field.';
                    ApplicationArea = All;
                }
                field("Posting Date"; Rec."Posting Date")
                {
                    ToolTip = 'Specifies the value of the Posting Date field.';
                    ApplicationArea = All;
                }
                field("Doc No."; Rec."Doc No.")
                {
                    ToolTip = 'Specifies the value of the Doc No. field.';
                    ApplicationArea = All;
                }
                field("Item No."; Rec."Item No.")
                {
                    ToolTip = 'Specifies the value of the Item No. field.';
                    ApplicationArea = All;
                }
                field(Location; Rec.Location)
                {
                    ToolTip = 'Specifies the value of the Location field.';
                    ApplicationArea = All;
                }
                field(Quantity; Rec.Quantity)
                {
                    ToolTip = 'Specifies the value of the Quantity field.';
                    ApplicationArea = All;
                }
                field("Serial No."; Rec."Serial No.")
                {
                    ToolTip = 'Specifies the value of the Serial No. field.';
                    ApplicationArea = All;
                }
                field("Purch Inv Exch Rate"; Rec."Purch Inv Exch Rate")
                {
                    ToolTip = 'Specifies the value of the Purch Inv Exch Rate field.';
                    ApplicationArea = All;
                }
                field("Purch Inv Total Price"; Rec."Purch Inv Total Price")
                {
                    ToolTip = 'Specifies the value of the Purch Inv Total Price field.';
                    ApplicationArea = All;
                }
                field("Purch Inv Unit Price"; Rec."Purch Inv Unit Price")
                {
                    ToolTip = 'Specifies the value of the Purch Inv Unit Price field.';
                    ApplicationArea = All;
                }
                field("Spot Exch Rate"; Rec."Spot Exch Rate")
                {
                    ToolTip = 'Specifies the value of the Spot Exch Rate field.';
                    ApplicationArea = All;
                }
                field("Exch Adj"; Rec."Exch Adj")
                {
                    ToolTip = 'Specifies the value of the Exch Adj field.';
                    ApplicationArea = All;
                }
            }
        }
    }

}
