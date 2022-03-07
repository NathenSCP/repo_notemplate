page 50425 "RDV Purchase details"
{
    ApplicationArea = All;
    Caption = 'Tag Printing';
    PageType = List;
    SourceTable = "Item Purchase Detail";
    UsageCategory = Lists;
    DeleteAllowed = false;
    Editable = false;
    InsertAllowed = false;
    LinksAllowed = true;

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
                field("Document No."; Rec."Document No.")
                {
                    ApplicationArea = All;
                }
                field("Item No."; Rec."Item No.")
                {
                    ToolTip = 'Specifies the value of the Item No. field.';
                    ApplicationArea = All;
                }
                field("Serial No."; Rec."Serial No.")
                {
                    ToolTip = 'Specifies the value of the Serial No. field.';
                    ApplicationArea = All;
                    ExtendedDatatype = URL;
                    trigger OnDrillDown()
                    var
                        cu: Codeunit "RDV Util";
                    begin
                        cu.DownloadBarcodeWithRequestPage(Rec."Serial No.");
                    end;
                }
                field("Cost Amount"; Rec."Cost Amount")
                {
                    ToolTip = 'Specifies the value of the Cost Amount field.';
                    ApplicationArea = All;
                }
                field("Item Description"; Rec."Item Description")
                {
                    ToolTip = 'Specifies the value of the Item Description field.';
                    ApplicationArea = All;
                }
                field("Item Cat"; Rec."Item Cat")
                {
                    ApplicationArea = All;
                }

                field("Item Price"; Rec."Item Price")
                {
                    ToolTip = 'Specifies the value of the Item Price field.';
                    ApplicationArea = All;
                }
                field("Price Discount Code"; Rec."Price Discount Code")
                {
                    ToolTip = 'Specifies the value of the Price Discount Code field.';
                    ApplicationArea = All;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {

            action(PrintBarcode)
            {
                ApplicationArea = All;
                Caption = 'Barcode';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = BarCode;
                Visible = false;
                trigger OnAction()
                var
                    cu: Codeunit "RDV Util";
                begin
                    cu.DownloadBarcodeWithRequestPage(Rec."Serial No.");
                end;
            }
        }
    }
}
