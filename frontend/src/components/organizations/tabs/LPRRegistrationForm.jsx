import React from 'react';

const LPRRegistrationForm = ({
	manualEntryForm,
	setManualEntryForm,
	onSubmit,
	onOpenWebcam,
	onCancel,
}) => {
	return (
		<div className="w-full px-2">
			<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
				<div className="mb-6 pb-4 border-b border-gray-200">
					<h3 className="text-2xl font-bold text-gray-900">Manual Vehicle Entry / Inspection</h3>
					<p className="text-gray-500 mt-1">Capture complete inspection details before gate approval.</p>
				</div>

				<form onSubmit={onSubmit} className="space-y-6">
					<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
						<div className="xl:col-span-2 space-y-6">
							<div className="rounded-xl border border-gray-200 p-5 md:p-6">
								<h4 className="text-2xl font-bold text-gray-900 mb-5">Vehicle Information</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Details *</label>
										<input
											type="text"
											value={manualEntryForm.vehicle_number}
											onChange={e => setManualEntryForm({ ...manualEntryForm, vehicle_number: e.target.value.toUpperCase() })}
											placeholder="MH 12 AB 1234"
											className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Entry Point</label>
										<select
											value={manualEntryForm.gate_name}
											onChange={e => setManualEntryForm({ ...manualEntryForm, gate_name: e.target.value })}
											className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
										>
											<option value="Main Gate">Main Gate</option>
											<option value="Gate 2">Gate 2 (Service)</option>
											<option value="VIP Gate">VIP Gate</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type *</label>
										<select
											value={manualEntryForm.vehicle_type}
											onChange={e => setManualEntryForm({ ...manualEntryForm, vehicle_type: e.target.value })}
											className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300 bg-white"
										>
											<option value="car">🚗 Car / SUV</option>
											<option value="bike">🏍️ Two Wheeler</option>
											<option value="truck">🚛 Truck / Lorry</option>
											<option value="van">🚐 Van / Pickup</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Date / Time</label>
										<input
											type="datetime-local"
											value={manualEntryForm.date_time}
											disabled
											className="w-full px-4 py-2.5 bg-gray-50 text-gray-500 border border-gray-300 rounded-lg text-sm"
										/>
									</div>
								</div>
							</div>

							<div className="rounded-xl border border-gray-200 p-5 md:p-6">
								<h4 className="text-xl font-bold text-gray-900 mb-5">Vehicle Inspection Photos</h4>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									{['front', 'back', 'side', 'trunk'].map((type) => {
										const existing = manualEntryForm.vehicle_photos.find(p => p.type === type);
										return (
											<div key={type} className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-center relative group shadow-sm">
												<p className="text-xs font-semibold text-gray-500 uppercase mb-1">{type}</p>
												{existing ? (
													<div className="relative">
														<img src={existing.base64} alt={type} className="w-full h-24 object-cover rounded" />
														<button
															type="button"
															onClick={() => setManualEntryForm(prev => ({
																...prev,
																vehicle_photos: prev.vehicle_photos.filter(p => p.type !== type)
															}))}
															className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm hover:bg-red-600"
														>
															✕
														</button>
													</div>
												) : (
													<button
														type="button"
														onClick={() => onOpenWebcam(type)}
														className="w-full h-24 bg-teal-50 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:bg-teal-100 hover:text-teal-700 hover:border-teal-400 transition-all duration-300 text-gray-500 gap-1"
													>
														<span className="text-xl">📷</span>
														<span className="text-xs font-semibold">Add Photo</span>
													</button>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</div>

						<div className="xl:col-span-1">
							<div className="rounded-xl border border-gray-200 p-5 md:p-6 xl:sticky xl:top-6">
								<h4 className="text-2xl font-bold text-gray-900 mb-5">Driver Details</h4>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Driver Name</label>
										<input
											type="text"
											value={manualEntryForm.driver_name}
											onChange={e => setManualEntryForm({ ...manualEntryForm, driver_name: e.target.value })}
											className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
											placeholder="Name"
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
										<input
											type="text"
											value={manualEntryForm.driver_phone}
											onChange={e => setManualEntryForm({ ...manualEntryForm, driver_phone: e.target.value })}
											className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
											placeholder="Mobile"
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">License ID</label>
										<input
											type="text"
											value={manualEntryForm.driver_license_id}
											onChange={e => setManualEntryForm({ ...manualEntryForm, driver_license_id: e.target.value })}
											className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
											placeholder="DL No."
										/>
									</div>
								</div>

								<div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
									<h5 className="text-sm font-semibold text-gray-700 mb-3">Security Checklist</h5>
									<div className="space-y-2">
										{Object.entries({
											puc_valid: 'Valid PUC',
											insurance_valid: 'Valid Insurance',
											no_prohibited_items: 'No Prohibited Items',
											undercarriage_checked: 'Undercarriage OK',
										}).map(([key, label]) => (
											<label key={key} className="flex items-center gap-2 text-sm cursor-pointer rounded-md px-1 py-1 hover:bg-gray-100 transition-colors duration-300">
												<input
													type="checkbox"
													checked={manualEntryForm.checklist_status[key]}
													onChange={e => setManualEntryForm(prev => ({
														...prev,
														checklist_status: { ...prev.checklist_status, [key]: e.target.checked },
													}))}
													className="w-4 h-4 text-teal-600 rounded"
												/>
												<span className={manualEntryForm.checklist_status[key] ? 'text-teal-700 font-medium' : 'text-gray-700'}>{label}</span>
											</label>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-xl border border-gray-200 p-5 md:p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">Material Inward Declaration</label>
								<textarea
									value={manualEntryForm.material_declaration}
									onChange={e => setManualEntryForm({ ...manualEntryForm, material_declaration: e.target.value })}
									placeholder="List any major materials/tools..."
									rows="3"
									className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">Security / Inspection Notes</label>
								<textarea
									value={manualEntryForm.vehicle_security_check_notes}
									onChange={e => setManualEntryForm({ ...manualEntryForm, vehicle_security_check_notes: e.target.value })}
									placeholder="Observations: Dents, Scratches, etc."
									rows="3"
									className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
								/>
							</div>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onCancel}
							className="px-6 py-3 text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-300"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
						>
							<span>Create Entry & Generate Pass</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default LPRRegistrationForm;
