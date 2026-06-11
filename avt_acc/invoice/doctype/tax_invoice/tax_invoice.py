# Copyright (c) 2026, Aavatto and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class TaxInvoice(Document):
	def autoname(self):
		self.name = f"GST/{self.invoice_year}/{self.tax_invoice_series}/{self.invoice_no}"

	def update_proforma_invoice(self, action):
		if not self.proforma_invoice:
			return
		p_invoice = frappe.get_doc("Proforma Invoice", self.proforma_invoice)
		if action == "submitted":
			p_invoice.db_set("status", "Converted")
		elif action == "cancelled":
			p_invoice.db_set("status", "Pending")
	
	def on_submit(self):
		self.update_proforma_invoice("submitted")
		self.db_set("outstanding_amount", self.total)
		self.db_set("paid_to_date", 0)
	
	def on_cancel(self):
		self.update_proforma_invoice("cancelled")
