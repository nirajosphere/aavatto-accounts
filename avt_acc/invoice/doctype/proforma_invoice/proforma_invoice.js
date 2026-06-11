// Copyright (c) 2026, Aavatto and contributors
// For license information, please see license.txt

frappe.ui.form.on("Proforma Invoice", {
	refresh(frm) {
		if (frm.doc.invoice_date) {
			frm.set_value("due_date", frappe.datetime.add_days(frm.doc.posting_date, 15));
		}
		if (frm.doc.status === "Converted") {
			frm.set_read_only();
		}
	},
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
