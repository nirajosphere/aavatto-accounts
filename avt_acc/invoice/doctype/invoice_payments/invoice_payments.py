# Copyright (c) 2026, Aavatto and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class InvoicePayments(Document):
	def update_invoice_amounts(self):
		invoice = frappe.get_doc("Tax Invoice", self.tax_invoice)

		payments = frappe.get_all(
			"Invoice Payments",
			filters={"tax_invoice": self.tax_invoice, "docstatus": 1},
			fields=["amount"]
		)

		total_paid = sum(p.amount for p in payments)
		outstanding_amount = invoice.total - total_paid
		invoice.db_set("paid_to_date", total_paid)
		invoice.db_set("outstanding_amount", outstanding_amount)
		if outstanding_amount <= 0:
			invoice.db_set('status', 'Fully Paid')
		elif outstanding_amount < invoice.total:
			invoice.db_set('status', 'Partially Paid')
		else:
			invoice.db_set('status', 'Unpaid')

	def validate(self):
		invoice = frappe.get_doc("Tax Invoice", self.tax_invoice)
		if invoice.docstatus != 1:
			frappe.throw("Payment allowed only for submitted Tax Invoice")
		if self.amount > invoice.outstanding_amount:
			frappe.throw(
				f"Payment amount ({self.amount}) cannot exceed Outstanding Amount ({invoice.outstanding_amount})"
			)
	
	def on_submit(self):
		self.update_invoice_amounts()

	def on_cancel(self):
		self.update_invoice_amounts()