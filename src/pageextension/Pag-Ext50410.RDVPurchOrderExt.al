pageextension 50410 "RDV Purch Order Ext" extends "Purchase Order"
{
    actions
    {
        addlast(reporting)
        {
            action(ActionName)
            {
                ApplicationArea = All;
                Caption = 'Print Barcode', comment = 'NLB="Print Barcode"';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = BarCode;
                trigger OnAction()
                var
                    report1: Report "RDV ItemBarcodeReport";
                    item: Record Item;
                    purchLines: Record "Purchase Line";
                begin

                    purchLines.Reset();
                    purchLines.SetRange("Document Type", purchLines."Document Type"::Order);
                    purchLines.SetRange("Document No.", Rec."No.");
                    purchLines.SetRange("Type", purchLines.Type::Item);

                    if purchLines.FindSet() then
                        repeat
                            item.Reset();
                            item.SetRange("No.", purchLines."No.");
                            report1.SetTableView(item);
                            report1.USEREQUESTPAGE(True);
                            report1.RunModal();
                        until purchLines.Next() = 0

                end;
            }
        }
    }
}
