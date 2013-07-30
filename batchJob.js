var initCreateItems = {};
initCreateItems.start = function (options) {
    try { if (this.opts.running) { alert("initCreateItems cannot start because it is already running. Try call reset before call start"); return; } } catch (e) { }
    this.opts = options;
    this.opts.running = true;
    if (typeof this.opts.onPrepareOnceFunction == 'function') { this.opts.onPrepareOnceFunction(); }
    options.onPrepareOnceFunction = null; // remove function reference since it run once
    if (typeof this.opts.onEveryStartFunction == 'function') { this.opts.onEveryStartFunction(); }
    this.opts.rowIndexCreating = 1;
    this.opts.asyncJobIsPaused = false;
    this.opts.failsCount = 0;
    $(this.opts.itemsToBuildTableID).show();
    $("#reset").css("color", "red");
    $("#reset").show();  $("#addItem").show(); // show reset and addNew btns since it has started
    $("#dialog-confirm").text(this.opts.confirmStartMsg); // asign texts from options obj
    $("#dialog-stop").text(this.opts.confirmStopMsg);
    this.allFields = $([]); // find all inputs and selects from the form and keep them into array
    $(this.opts.dialogForm + ' fieldset input').each(function () {
        initCreateItems.allFields = initCreateItems.allFields.add($(this));
    });
    $(this.opts.dialogForm + ' fieldset select').each(function () {
        initCreateItems.allFields = initCreateItems.allFields.add($(this));
    });
    $(this.opts.dialogForm).dialog({
        autoOpen: false, height: "auto", width: "auto", modal: true,
        buttons: {
            "Add": function () {
                var htmlString = "<tr>"; // build table row to add. 
                for (var d = 0; d < initCreateItems.allFields.length; d++) {
                    htmlString += "<td>" + $(initCreateItems.allFields[d]).val() + "</td>";
                }
                htmlString += "<td class='actions'>" + "<button class='removeMe'>remove</button>" + "</td></tr>";
                $(initCreateItems.opts.itemsToBuildTableID + ' tbody').append(htmlString);
                $(this).dialog("close"); $("#createItems").show();
            },
            Cancel: function () { $(this).dialog("close"); }
        },
        close: function () {
            initCreateItems.allFields.val(""); // clear form inputs
            $(".removeMe").button().click(function () {
                $(this).closest('tr').remove();
                if ($(initCreateItems.opts.itemsToBuildTableID + ' tr').length < 2) $("#createItems").hide(); // all rows are removed, hide Start btn
            });
        }
    });
    $("#addItem").button().click(function () { $(initCreateItems.opts.dialogForm).dialog("open"); });
    $("#reset").button().click(function () {
        if ($(initCreateItems.opts.itemsToBuildTableID + ' tr').length > 1) {
            if (confirm(initCreateItems.opts.confirmResetMsg)) { initCreateItems.reset(); } else { return false; }
        } else { initCreateItems.reset(); // reset without confirm since you loose nothing due to empty table
  	}
    });
    $("#createItems").button().click(function () { $("#dialog-confirm").dialog("open"); });
    $("#dialog-confirm").dialog({ // confirm start batch job for the data in the table
        resizable: false, autoOpen: false, height: "auto", width: "auto", modal: true,
        buttons: {
            "Start": function () {
                initCreateItems.disableAddItem();
                initCreateItems.opts.asyncJobIsPaused = false;
                $(this).dialog("close");
                initCreateItems.createNextItem();
            },
            Cancel: function () { $(this).dialog("close"); }
        }
    });
    $("#stopCreatingItems").button().click(function () {
        initCreateItems.opts.asyncJobIsPaused = true;
        $("#dialog-stop").dialog("open"); // pause batch job
    });
    $("#dialog-stop").dialog({
        resizable: false, height: "auto", width: "auto", autoOpen: false, modal: true,
        buttons: {
            "Stop": function () {
                initCreateItems.enableAddItem();
                $(this).dialog("close");
            },
            "Continue": function () {
                initCreateItems.opts.asyncJobIsPaused = false;
                initCreateItems.createNextItem();
                $(this).dialog("close");
            }
        }
    });
};
initCreateItems.createNextItem = function () {
    if (!this.opts.asyncJobIsPaused) {
        var rows = $(this.opts.itemsToBuildTableID + ' tr').length;
        if (rows > this.opts.rowIndexCreating) {
            this.opts.selectedRow = this.opts.itemsToBuildTableID + " > tbody  > tr:nth-child(" + this.opts.rowIndexCreating + ")";
            $(this.opts.selectedRow + " .removeMe").hide(); // cannot remove it anymore
            $(this.opts.selectedRow + " .actions").text("working...");
            // put spinner in that div            
            // build a json with current row data to send to external function
            this.opts.createWithFunction(this.opts.confirmStopMsg);
        } else {
            alert(this.opts.onCompleteMsg);
            this.enableAddItem();
        }
    }
};
initCreateItems.reset = function () { // clear data table. Leave table header as is
    if (typeof this.opts.onResetFunction == 'function') this.opts.onResetFunction();
    $(this.opts.itemsToBuildTableID + ' tr').not(':first').each(function () { this.remove(); });
    $("#reset").button().off();
    $("#createItems").hide();
    this.opts.running = false;
};
initCreateItems.enableAddItem = function () {
    $("#createItems").show(); $("#addItem").show();
    $("#stopCreatingItems").hide(); $("#reset").show();
};
initCreateItems.disableAddItem = function () {
    $("#createItems").hide(); $("#addItem").hide();
    $("#stopCreatingItems").show(); $("#reset").hide();
};
initCreateItems.successBuild = function () {
    $(initCreateItems.opts.selectedRow + " .actions").text("done");
    initCreateItems.opts.rowIndexCreating++;
    initCreateItems.createNextItem();
};
initCreateItems.failBuild = function () { // count fails. Stop if max is reached. 
    $(initCreateItems.opts.selectedRow + " .actions").html("<span style='color:red;'>fail</span>");
    initCreateItems.opts.rowIndexCreating++;
    if (++initCreateItems.opts.failsCount < initCreateItems.opts.stopAfterFails) {
        initCreateItems.createNextItem();
    } else { $("#stopCreatingItems").click(); }
};
