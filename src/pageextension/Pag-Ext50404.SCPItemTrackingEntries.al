pageextension 50404 "SCPItemTrackingEntries" extends "Item Tracking Entries"
{
    layout
    {
        addafter("Serial No.")
        {
            field("Gia Number"; gianumber)
            {
                ApplicationArea = All;
                Editable = false;
                Caption = 'GIA/Serial No.';

                trigger OnDrillDown()
                var
                    lPage: Page "SCP GIA List";
                    lrec: record "SCP Gci Tracking";

                begin
                    lrec.Reset();
                    lrec.SetRange("Serial No.", Rec."Serial No.");
                    //lrec.SetRange("Item Ledger Entry No.", Rec."Entry No.");
                    lrec.SetRange("Item No.", rec."Item No.");

                    if not lrec.IsEmpty() then begin
                        Page.RunModal(PAGE::"SCP GIA List", lrec);
                    end

                end;
            }
        }
    }

    var
        gianumber: Label 'GIA/Serial No.';
}
