page 50401 "SCP GIA List"
{

    Caption = 'GIA/Serial No.';
    PageType = List;
    SourceTable = "SCP Gci Tracking";
    Editable = true;
    InsertAllowed = false;
    ModifyAllowed = true;
    DeleteAllowed = false;
    LinksAllowed = false;
    ApplicationArea = All;
    UsageCategory = Lists;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Item No."; Rec."Item No.")
                {
                    ToolTip = 'Specifies the value of the Item No. field';
                    ApplicationArea = All;
                    Editable = false;
                }
                field("Item Ledger Entry No."; Rec."Item Ledger Entry No.")
                {
                    ApplicationArea = All;
                    Editable = false;
                }
                field("Purch. Entry Type"; Rec."Purch. Entry Type")
                {
                    ApplicationArea = All;
                    Editable = false;
                }

                field("Purch. Doc Type"; Rec."Purch. Doc Type")
                {
                    ApplicationArea = All;
                    Editable = false;
                }

                field("Purch. Doc No."; Rec."Purch. Doc No.")
                {
                    ApplicationArea = All;
                    Editable = false;
                }

                field("Sale Entry Type"; Rec."Sale Entry Type")
                {
                    ApplicationArea = All;
                    Editable = false;
                }

                field("Sale Doc No."; Rec."Sale Doc No.")
                {
                    ApplicationArea = All;
                    Editable = false;
                }

                field("Sale Doc Type"; Rec."Sale Doc Type")
                {
                    ApplicationArea = All;
                    Editable = false;
                }
                field("Serial No."; Rec."Serial No.")
                {
                    ToolTip = 'Specifies the value of the Serial No. field';
                    ApplicationArea = All;
                    Editable = false;
                }
                field("GIA No."; Rec."GIA No.")
                {
                    ToolTip = 'Specifies the value of the GIA/Serial No. field';
                    ApplicationArea = All;
                    Caption = 'GIA/Serial No.';
                    Editable = true;
                }

            }
        }
    }

}
