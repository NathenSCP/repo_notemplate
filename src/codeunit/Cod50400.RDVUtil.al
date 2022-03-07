codeunit 50400 "RDV Util"
{

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Item Jnl.-Post Line", 'OnBeforeCheckItemTracking', '', false, false)]
    local procedure OnBeforeCheckItemTracking(ItemJournalLine: Record "Item Journal Line";
    ItemTrackingSetup: Record "Item Tracking Setup";
    var IsHandled: Boolean;
    var TempTrackingSpecification: Record "Tracking Specification")
    var
        lItem: Record Item;
        lrecGCITracking: record "SCP Gci Tracking";
    begin
        if lItem.Get(ItemJournalLine."Item No.") then begin
            if lItem."SCP Is GCI Mand" then begin
                if (TempTrackingSpecification."Serial No." = '') then
                    Error('Serial No. is required');

                lrecGCITracking.Reset();
                lrecGCITracking.SetRange("Serial No.", TempTrackingSpecification."Serial No.");

                lrecGCITracking.SetFilter("GIA No.", '=%1', '');

                if lrecGCITracking.FindFirst() then begin
                    Error('GCI No. is required for serial no. %1', TempTrackingSpecification."Serial No.");
                end;
            end
        end;
    end;

    /*
        [EventSubscriber(ObjectType::Page, Page::"Item Tracking Lines", 'OnInsertRecordOnBeforeTempItemTrackLineInsert', '', false, false)]
        local procedure OnInsertRecordOnBeforeTempItemTrackLineInsert(

        var TempTrackingSpecificationInsert: Record "Tracking Specification";
        var TempTrackingSpecification: Record "Tracking Specification")
        var
            lGCI: Record "SCP Gci Tracking";
        begin

            lGCI.Reset();
            lGCI.SetRange("Serial No.", TempTrackingSpecificationInsert."Serial No.");
            lGCI.DeleteAll();

            lGCI.Init();
            lGCI."Entry No." := lGCI.GetEntryNo() + 1;
            lGCI.Validate("Serial No.", TempTrackingSpecificationInsert."Serial No.");
            lGCI.Validate("Item No.", TempTrackingSpecificationInsert."Item No.");
            lGCI.Validate("Item Ledger Entry No.", TempTrackingSpecificationInsert."Item Ledger Entry No.");
            lGCI.Validate("Tracking Spec Entry No.", TempTrackingSpecificationInsert."Entry No.");
            lGCI.Insert();
        end;
    */
    [EventSubscriber(ObjectType::Page, Page::"Item Tracking Lines", 'OnBeforeOnModifyRecord', '', false, false)]
    local procedure OnBeforeOnModifyRecord(var TrackingSpecification: Record "Tracking Specification"; xTrackingSpecification: Record "Tracking Specification"; InsertIsBlocked: Boolean; var Result: Boolean; var IsHandled: Boolean)
    var
        lGCI: Record "SCP Gci Tracking";
    begin

        if TrackingSpecification."Serial No." <> xTrackingSpecification."Serial No." then begin
            if xTrackingSpecification."Serial No." <> '' then begin
                lGCI.Reset();
                lGCI.SetRange("Serial No.", xTrackingSpecification."Serial No.");
                lGCI.DeleteAll();
            end;

            lGCI.Reset();
            lGCI.SetRange("Serial No.", TrackingSpecification."Serial No.");
            lGCI.DeleteAll();

            lGCI.Init();
            lGCI."Entry No." := lGCI.GetEntryNo() + 1;
            lGCI.Validate("Serial No.", TrackingSpecification."Serial No.");
            lGCI.Validate("Item No.", TrackingSpecification."Item No.");
            lGCI.Validate("Item Ledger Entry No.", TrackingSpecification."Item Ledger Entry No.");
            lGCI.Validate("Tracking Spec Entry No.", TrackingSpecification."Entry No.");
            lGCI.Insert();
        end
    end;

    [EventSubscriber(ObjectType::Page, Page::"Item Tracking Lines", 'OnBeforeDeleteRecord', '', false, false)]
    local procedure OnBeforeDeleteRecord(var TrackingSpecification: Record "Tracking Specification");
    var
        lGCI: Record "SCP Gci Tracking";
    begin
        lGCI.Reset();
        lGCI.SetRange("Serial No.", TrackingSpecification."Serial No.");
        lGCI.DeleteAll();
    end;

    /*

        [EventSubscriber(ObjectType::Codeunit, Codeunit::"Purch. Line-Reserve", 'OnCallItemTrackingOnBeforeItemTrackingFormRunModal', '', false, false)]
        local procedure OnCallItemTrackingOnBeforeItemTrackingFormRunModal(var PurchLine: Record "Purchase Line"; var ItemTrackingForm: Page "Item Tracking Lines")
        var
            lrecItem: Record Item;
            lrecTracking: record "Tracking Specification";
        begin
            lrecItem.Reset();
            lrecItem.Get(PurchLine."No.");

            if lrecItem."SCP Is GCI Mand" then begin
                ItemTrackingForm.GetRecord(lrecTracking);
                if lrecTracking."Serial No." = '' then begin
                    lrecTracking.Validate("Serial No.", 'NewABC123');
                    ItemTrackingForm.SetRecord(lrecTracking);
                end
            end
        end;*/

    procedure InsertGIANumberForSerialNumber(TrackingSpecification: record "Tracking Specification"): Boolean
    var
        lGCI: Record "SCP Gci Tracking";
    begin
        lGCI.Init();
        lGCI."Entry No." := lGCI.GetEntryNo() + 1;
        lGCI.Validate("Serial No.", TrackingSpecification."Serial No.");
        lGCI.Validate("Item No.", TrackingSpecification."Item No.");
        lGCI.Validate("Item Ledger Entry No.", TrackingSpecification."Item Ledger Entry No.");
        lGCI.Validate("Tracking Spec Entry No.", TrackingSpecification."Entry No.");
        if lGCI.Insert() then begin
            Commit();
            Exit(true);
        end;

        Exit(false);
    end;

    procedure DownloadBarcode(docNo: Code[20])
    var
        ReportParameters: text;
        TempBlob: Codeunit "Temp Blob";
        FileManagement: Codeunit "File Management";
        OStream: OutStream;
        SelectedExportType: Integer;
        ExportType: Label 'PDF,Excel,Word,HTML,XML';
        StrMenuMsg: Label 'Please choose one of the export types:';
        RecRef: RecordRef;
        reportRec: Record "Item Purchase Detail";
    begin
        reportRec.Reset();
        reportRec.SetRange("Document No.", docNo);
        reportRec.FindFirst();

        Clear(OStream);
        RecRef.GetTable(reportRec);
        TempBlob.CreateOutStream(OStream);
        //ReportParameters := Report.RunRequestPage(50402);
        Report.SaveAs(50402, '', ReportFormat::Pdf, OStream, RecRef);
        FileManagement.BLOBExport(TempBlob, 'Barcode' + '_' + Format(CURRENTDATETIME, 0, '<Day,2><Month,2><Year4><Hours24><Minutes,2><Seconds,2>') + '.pdf', true);

    end;

    procedure DownloadBarcodeWithRequestPage(serialNo: Code[20])
    var
        ReportParameters: text;
        TempBlob: Codeunit "Temp Blob";
        FileManagement: Codeunit "File Management";
        OStream: OutStream;
        SelectedExportType: Integer;
        ExportType: Label 'PDF,Excel,Word,HTML,XML';
        StrMenuMsg: Label 'Please choose one of the export types:';
        RecRef: RecordRef;
        reportRec: Record "Item Purchase Detail";
        Report50402: Report "RDV ItemBarcodeReport";
    begin
        reportRec.Reset();
        reportRec.SetRange("Serial No.", serialNo);
        reportRec.FindFirst();

        Clear(OStream);
        RecRef.GetTable(reportRec);
        TempBlob.CreateOutStream(OStream);
        //ReportParameters := Report.RunRequestPage(50402);
        Report.SaveAs(50402, '', ReportFormat::Pdf, OStream, RecRef);
        FileManagement.BLOBExport(TempBlob, 'Barcode' + '_' + Format(CURRENTDATETIME, 0, '<Day,2><Month,2><Year4><Hours24><Minutes,2><Seconds,2>') + '.pdf', true);

    end;

}
