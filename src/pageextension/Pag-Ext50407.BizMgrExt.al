pageextension 50407 "Biz Mgr Ext" extends "Business Manager Role Center"
{
    actions
    {
        addlast(sections)
        {
            group("QR Code")
            {
                action(QRCode)
                {
                    RunObject = page "RDV Customer";
                    ApplicationArea = All;
                    Caption = 'Customer by QR Code';
                    RunPageMode = Create;
                }
            }

            group(Allowance)
            {
                action(AllowancePage1)
                {
                    RunObject = page "RDV Inventory Allowance Rate";
                    ApplicationArea = All;
                    Caption = 'RDV Inventory Allowance Rate';
                }
                action(AllowancePage2)
                {
                    RunObject = page "RDV Inv All Led Entry";
                    ApplicationArea = All;
                    Caption = 'RDV Inventory Allowance Ledger Entry';
                }
                action(AllowancePage3)
                {
                    RunObject = page "RDV Inventory Allowance";
                    ApplicationArea = All;
                    Caption = 'RDV Inventory Allowance';
                }
                action(AllowancePage4)
                {
                    RunObject = page "RDV Closing Inventory All";
                    ApplicationArea = All;
                    Caption = 'RDV Closing Inventory Allowance';
                }
                action(AllowancePage5)
                {
                    RunObject = page "RDV Inv Allow Register";
                    ApplicationArea = All;
                    Caption = 'RDV Inventory Allowance Register';
                }
                action(AllowancePage6)
                {
                    RunObject = page "RDV Inv Allow Dtl Led Entry";
                    ApplicationArea = All;
                    Caption = 'Allowance Detail Ledger Entry';
                }
            }
            group(Inventory)
            {
                action(Page1)
                {
                    RunObject = page "Custom Iventory Page";
                    ApplicationArea = All;
                    Caption = 'RDV Inventory';
                }

                action(Currency)
                {
                    RunObject = page "Currency Exchange Rates";
                    ApplicationArea = All;
                    Caption = 'Currency Exchange Rates';
                }

                action(GLE)
                {
                    RunObject = page "General Ledger Setup";
                    ApplicationArea = All;
                    Caption = 'General Ledger Setup';
                }

                action(Page4)
                {
                    RunObject = page "Spot Exc Rate Value Entries";
                    ApplicationArea = All;
                    Caption = 'Purchase Invoice Exchange Rate Entries';
                }

                action(Page2)
                {
                    RunObject = page "Inventory Exc Rate Adju";
                    ApplicationArea = All;
                    Caption = 'Inventory Exchange Rate Adjustment';
                }

                action(Page6)
                {
                    RunObject = page "COGS Exchange Adjustment";
                    ApplicationArea = All;
                    Caption = 'COGS Exchange Adjustment';
                }

                action(Page5)
                {
                    RunObject = page "Posted Inv Exch Adj List";
                    ApplicationArea = All;
                    Caption = 'Posted Inventory Exchange Adjustment List';
                }

                action(Page7)
                {
                    RunObject = page "Posted COGS Exch Adj List";
                    ApplicationArea = All;
                    Caption = 'Posted COGS Exch Adj List';
                }

                action(Page8)
                {
                    RunObject = page "Inventory adjustment Register";
                    ApplicationArea = All;
                    Caption = 'Inventory adjustment Register';
                }
                action(Page9)
                {
                    RunObject = page "COGS Adj Register";
                    ApplicationArea = All;
                    Caption = 'COGS Adj Register';
                }
                action(Page10)
                {
                    RunObject = page "General Ledger Entries";
                    ApplicationArea = All;
                    Caption = 'General Ledger Entries';
                }

            }
        }
    }

}
