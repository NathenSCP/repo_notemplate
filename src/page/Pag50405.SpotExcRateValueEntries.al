page 50405 "Spot Exc Rate Value Entries"
{

    ApplicationArea = All;
    Caption = 'Purchase Invoice Exchange Rate Entries';
    PageType = List;
    SourceTable = "Purchase Invoice Exchange Rate";
    UsageCategory = Administration;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Value Entry No."; Rec."Value Entry No.")
                {
                    ToolTip = 'Specifies the value of the Value Entry No. field';
                    ApplicationArea = All;
                }
                field("Item Ledger Entry No."; Rec."Item Ledger Entry No.")
                {
                    ToolTip = 'Specifies the value of the Item Ledger Entry No. field';
                    ApplicationArea = All;
                }
                field("Item No."; Rec."Item No.")
                {
                    ToolTip = 'Specifies the value of the Item No. field';
                    ApplicationArea = All;
                }
                field("Location Code"; Rec."Location Code")
                {
                    ApplicationArea = All;
                }
                field("Invoiced Quantity"; Rec."Invoiced Quantity")
                {
                    ToolTip = 'Specifies the value of the Quantity field';
                    ApplicationArea = All;
                }
                field("Serial No."; Rec."Serial No.")
                {
                    ToolTip = 'Specifies the value of the Serial No. field';
                    ApplicationArea = All;
                }
                field("Spot Exchange Rate"; Rec."Spot Exchange Rate")
                {
                    ToolTip = 'Specifies the value of the Spot Exchange Rate field';
                    ApplicationArea = All;
                }
                field("System Exchange Rate"; Rec."System Exchange Rate")
                {
                    ToolTip = 'Specifies the value of the System Exchange Rate field';
                    ApplicationArea = All;
                }
                field("Cost Amount (Actual)"; Rec."Cost Amount(Actual)")
                {
                    ApplicationArea = All;
                }
                field("Currency Code"; Rec."Currency Code")
                {
                    ApplicationArea = All;
                }
                field("Currency Factor"; Rec."Currency Factor")
                {
                    ApplicationArea = All;
                }
                field("Currency Exch Rate Start Date"; Rec."Currency Exch Rate Start Date")
                {
                    ApplicationArea = All;
                }

                field("Sales Posted"; Rec."Sales Posted")
                {
                    ApplicationArea = All;
                }

                field("Purchase Posted"; Rec."Purchase Posted")
                {
                    ApplicationArea = All;
                }
                field(image; Rec."Sales Posted Image")
                {
                    ApplicationArea = All;
                    Visible = false;
                }

            }
        }
    }

    trigger OnAfterGetRecord()
    var
        t: Record table_Images;
        inStreamImage: InStream;
        OutStreamImage: OutStream;
    begin

        //Message('OnAfterGetRecord');
        if Rec."Sales Posted" then begin
            t.SetRange(Name, 'OK');
            if t.FindFirst() then begin

                t.Image.CreateInStream(inStreamImage);
                Rec."Sales Posted Image".CreateOutStream(OutStreamImage);
                CopyStream(OutStreamImage, inStreamImage);
                Rec.Modify();
            end;
        end;
    end;


}
