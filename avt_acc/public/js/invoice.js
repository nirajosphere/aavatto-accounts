window.avt_acc = window.avt_acc || {};
window.avt_acc.invoice = window.avt_acc.invoice || {};

window.avt_acc.invoice.calculate_line_total = (frm, cdt, cdn) => {
	var row = locals[cdt][cdn];
	if (row.unit_cost && row.quantity) {
		frappe.model.set_value(cdt, cdn, "line_total", row.unit_cost * row.quantity);
	}
	window.avt_acc.invoice.calculate_subtotal(frm);
};
window.avt_acc.invoice.set_currency = (frm) => {
	let currency = frm.doc.currency;
	if (currency) {
		(frm.doc.table_yevf || []).forEach((row) => {
			frappe.model.set_value(row.doctype, row.name, "currency", currency);
		});
		frm.refresh_fields("table_yevf");
		(frm.doc.taxes || []).forEach((row) => {
			frappe.model.set_value(row.doctype, row.name, "currency", currency);
		});
		frm.refresh_fields("taxes");
	}
};
window.avt_acc.invoice.calculate_subtotal = (frm) => {
	let subtotal = 0;

	(frm.doc.table_yevf || []).forEach((row) => {
		subtotal += flt(row.line_total);
	});

	frm.set_value("subtotal", subtotal);
};
window.avt_acc.invoice.calculate_taxable_amount = (frm) => {
	let taxable_amount = frm.doc.subtotal || 0;
	let discount_amount = frm.doc.discount || 0;
	if (frm.doc.discount_type === "Percentage") {
		let discount_amount = (frm.doc.subtotal * frm.doc.discount_percentage) / 100;
		frm.set_value("discount", discount_amount);
	}
	taxable_amount = frm.doc.subtotal - frm.doc.discount;
	frm.set_value("taxable_amount", Math.max(0, taxable_amount));
};
window.avt_acc.invoice.calculate_total = (frm) => {
	frm.set_value("total", frm.doc.taxable_amount + frm.doc.tax);
};
window.avt_acc.invoice.calculate_taxes = (frm) => {
	window.avt_acc.invoice.set_currency(frm);
	let subtotal = frm.doc.subtotal;
	let total_tax = 0;
	(frm.doc.taxes || []).forEach((row) => {
		let tax_amount = (subtotal * row.tax_rate || 0) / 100;
		frappe.model.set_value(row.doctype, row.name, "tax_amount", tax_amount);
		total_tax = total_tax + tax_amount;
	});
	frm.set_value("tax", total_tax);
};
