// Copyright (c) 2026, Aavatto and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Invoice Payments", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Invoice Payments", {
	currency: function (frm) {
		handle_currency_logic(frm);
	},

	amount: function (frm) {
		calculate_converted_amount(frm);
		if (!frm.doc.tax_invoice || !frm.doc.amount) return;

		frappe.db.get_value("Tax Invoice", frm.doc.tax_invoice, "outstanding_amount").then((r) => {
			if (frm.doc.amount > r.message.outstanding_amount) {
				frappe.msgprint("Amount cannot exceed outstanding amount");
				frm.set_value("amount", "");
			}
		});
	},

	conversion_rate: function (frm) {
		calculate_converted_amount(frm);
	},

	converted_amount: function (frm) {
		calculate_conversion_rate(frm);
	},

	onload: function (frm) {
		handle_currency_logic(frm);
	},
	tax_invoice: function (frm) {
		if (!frm.doc.tax_invoice) return;

		frappe.db
			.get_value("Tax Invoice", frm.doc.tax_invoice, ["docstatus", "bank_account_details"])
			.then((r) => {
				if (r.message.docstatus !== 1) {
					frappe.msgprint("You can only create payment against a submitted Tax Invoice");
					frm.set_value("tax_invoice", "");
				}
				if (r.message.bank_account_details) {
					frm.set_value("bank_account", r.message.bank_account_details);
				}
			});
	},
});

function handle_currency_logic(frm) {
	if (!frm.doc.currency) return;

	// Get system currency
	frappe.db.get_single_value("System Settings", "currency").then((system_currency) => {
		if (frm.doc.currency === system_currency) {
			// Same as system currency
			frm.set_value("conversion_rate", 1);
			frm.set_df_property("conversion_rate", "read_only", 1);
			frm.set_df_property("converted_amount", "read_only", 1);

			// frm.set_df_property("converted_amount", "hidden", 1);
			// frm.set_df_property("conversion_rate", "hidden", 1);

			frm.set_value("converted_amount", frm.doc.amount || 0);
		} else {
			// Different currency
			frm.set_df_property("conversion_rate", "read_only", 0);
			frm.set_df_property("converted_amount", "read_only", 0);
			// frm.set_df_property("converted_amount", "hidden", 0);
			// frm.set_df_property("conversion_rate", "hidden", 0);

			calculate_converted_amount(frm);
		}
		frm.set_df_property("amount", "description", `Amount in ${frm.doc.currency || ""}`);
		frm.set_df_property(
			"converted_amount",
			"description",
			`Amount in ${system_currency || ""}`,
		);
		frm.refresh_fields(["conversion_rate", "converted_amount", "amount"]);
	});
}

function calculate_converted_amount(frm) {
	if (!frm.doc.amount || !frm.doc.conversion_rate) return;

	let converted = flt(frm.doc.amount) * flt(frm.doc.conversion_rate);
	frm.set_value("converted_amount", converted);
}

function calculate_conversion_rate(frm) {
	if (!frm.doc.amount || !frm.doc.converted_amount) return;

	let rate = flt(frm.doc.converted_amount) / flt(frm.doc.amount);
	frm.set_value("conversion_rate", rate);
}
