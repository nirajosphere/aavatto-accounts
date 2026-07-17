// Copyright (c) 2026, Aavatto and contributors
// For license information, please see license.txt
function get_proforma_and_autofill(frm) {
	frappe.call({
		method: "frappe.client.get",
		args: {
			doctype: "Proforma Invoice",
			name: frm.doc.proforma_invoice,
		},
		callback: function (r) {
			let source = r.message;

			// copy parent fields
			frm.set_value("customer", source.customer);
			frm.set_value("currency", source.currency);

			// clear existing items
			frm.clear_table("table_yevf");

			// copy child table
			source.table_yevf.forEach((row) => {
				let d = frm.add_child("table_yevf");
				d.description = row.description;
				d.currency = row.currency;
				d.unit_cost = row.unit_cost;
				d.quantity = row.quantity;
				d.hsn = row.hsn;
				d.line_total = row.line_total;
			});

			frm.refresh_field("table_yevf");
			frm.clear_table("taxes");

			// copy child table
			source.taxes.forEach((row) => {
				let d = frm.add_child("taxes");
				d.tax = row.tax;
				d.type = row.type;
				d.tax_rate = row.tax_rate;
				d.tax_name = row.tax_name;
				d.currency = row.currency;
				d.tax_amount = row.tax_amount;
			});

			frm.refresh_field("taxes");
			frm.set_value("discount_type", source.discount_type);
			frm.set_value("subtotal", source.subtotal);
			frm.set_value("discount", source.discount);
			frm.set_value("taxable_amount", source.taxable_amount);
			frm.set_value("tax", source.tax);
			frm.set_value("total", source.total);
			frm.set_value("po_number", source.po_number);
		},
	});
}
frappe.ui.form.on("Tax Invoice", {
	refresh(frm) {
		if (frm.doc.invoice_date && !frm.doc.due_date) {
			frm.set_value("due_date", frappe.datetime.add_days(frm.doc.posting_date, 15));
		}
		if (frm.doc.payment_status === "Fully Paid") {
			frm.dashboard.set_indicator("Fully Paid", "green");
		} else if (frm.doc.payment_status === "Partially Paid") {
			frm.dashboard.set_indicator("Partially Paid", "orange");
		} else if (frm.doc.payment_status === "Unpaid") {
			frm.dashboard.set_indicator("Unpaid", "red");
		}
	},
	proforma_invoice: get_proforma_and_autofill,
	currency: avt_acc.invoice.set_currency,
	discount_percentage: avt_acc.invoice.calculate_taxable_amount,
	subtotal: avt_acc.invoice.calculate_taxable_amount,
	discount: avt_acc.invoice.calculate_taxable_amount,
	discount_type: avt_acc.invoice.calculate_taxable_amount,
	taxable_amount: avt_acc.invoice.calculate_total,
	tax: avt_acc.invoice.calculate_total,
	invoice_date: (frm) => {
		if (frm.doc.invoice_date) {
			frm.set_value("due_date", frappe.datetime.add_days(frm.doc.posting_date, 15));
		}
	},
	onload: function (frm) {
		if (frm.is_new() && frm.doc.proforma_invoice) {
			get_proforma_and_autofill(frm);
		}
	},
});
frappe.ui.form.on("Invoice Taxes", {
	tax: avt_acc.invoice.calculate_taxes,
	tax_rate: avt_acc.invoice.calculate_taxes,
	taxes_add: avt_acc.invoice.calculate_taxes,
	taxes_remove: avt_acc.invoice.calculate_taxes,
});
frappe.ui.form.on("Invoice Particulars", {
	refresh(frm) {},
	unit_cost: avt_acc.invoice.calculate_line_total,
	quantity: avt_acc.invoice.calculate_line_total,
	line_total: (frm) => {
		avt_acc.invoice.calculate_subtotal(frm);
		avt_acc.invoice.calculate_taxes(frm);
	},
	//  Update currency on add or remove of the child item in Proforma Invoice
	table_yevf_add: (frm) => {
		avt_acc.invoice.set_currency(frm);
		avt_acc.invoice.calculate_subtotal(frm);
	},
	table_yevf_remove: (frm) => {
		avt_acc.invoice.set_currency(frm);
		avt_acc.invoice.calculate_subtotal(frm);
	},
});
