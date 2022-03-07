pageextension 50409 "RDV Customer List" extends "Customer List"
{
    actions
    {
        addfirst(Documents)
        {
            action(CounterSalesOrders)
            {
                ApplicationArea = Basic, Suite;
                Caption = 'Counter Sales Order';
                Image = Document;
                Promoted = true;
                PromotedCategory = Category5;
                PromotedIsBig = true;
                PromotedOnly = true;
                // RunObject = Page "IWX POS Sales Order";
                // RunPageLink = "Sell-to Customer No." = FIELD("No.");
                RunPageMode = Create;
                ToolTip = 'Create a counter sales order';

                // trigger OnAction()
                // var
                //     c: Record "Sales Header";
                //     p: page "IWX POS Sales Order";
                // begin
                //     c.Reset();

                //     c.Get(c."Document Type"::Order, Rec."No.");
                //     Clear(p);
                //     p.SetTableView(c);
                //     p.SetRecord(c);
                //     //    p.SetTableView(Rec);
                //     p.RunModal();

                // end;
            }
        }
        addafter("C&ontact")
        {
            action(ActionName)
            {
                ApplicationArea = All;
                Caption = 'QR Code Scan', comment = 'NLB="YourLanguageCaption"';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = Process;
                trigger OnAction()
                var
                    p: Page "RDV Customer";
                begin
                    p.Run();
                end;
            }
        }
    }
}
