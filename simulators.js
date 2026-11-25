/* ── Global Simulator Router ── */
const REPO_URLS = {
  pharmacy: 'https://github.com/KareemYousry-33/PharmacySystem',
  signalr: 'https://github.com/KareemYousry-33/SignalR-ChatApp',
  etman: 'https://github.com/KareemYousry-33/Etman-App',
  ecommerce: 'https://github.com/KareemYousry-33/nterpriseCommerce-CleanArchitecture.',
  obour: 'https://github.com/KareemYousry-33/obour-cs-hub',
  taskati: 'https://github.com/KareemYousry-33/Taskati-App',
  sahltahalak: 'https://github.com/KareemYousry-33/sahltahalak'
};

function selectSim(simKey, shouldScroll = true) {
  document.querySelectorAll('.sim-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.sim === simKey);
  });
  document.querySelectorAll('.sim-panel').forEach((p) => {
    p.classList.toggle('active', p.id === 'panel-' + simKey);
  });
  const repoBtn = document.getElementById('sim-repo-btn');
  if (repoBtn && REPO_URLS[simKey]) {
    repoBtn.href = REPO_URLS[simKey];
  }
  const simEl = document.getElementById('simulator');
  if (shouldScroll && simEl) {
    simEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ══════════════════════════════════════════════════
   1. PHARMACYSYSTEM API (.NET 10 + CLEAN ARCH)
   ══════════════════════════════════════════════════ */
let pharmaState = {};

function pharmacyInitData() {
  pharmaState = {
    nextMedId: 6,
    nextCustId: 4,
    nextInvId: 101,
    nextPayId: 201,
    medicines: [
      { id: 1, name: 'Panadol Extra 500mg', code: 'MED-01', price: 45, quantity: 32 },
      { id: 2, name: 'Augmentin 1g', code: 'MED-02', price: 118, quantity: 14 },
      { id: 3, name: 'Catafast 50mg Sachet', code: 'MED-03', price: 65, quantity: 20 },
      { id: 4, name: 'Concor 5mg', code: 'MED-04', price: 82, quantity: 9 },
      { id: 5, name: 'Vitamin D3 5000 IU', code: 'MED-05', price: 140, quantity: 18 }
    ],
    customers: [
      { id: 1, name: 'Ahmed Hassan', address: 'Zagazig - Al Kawmia', phoneNumber: '01012345678', totalDebt: 120 },
      { id: 2, name: 'Mona Ibrahim', address: 'Cairo - Nasr City', phoneNumber: '01198765432', totalDebt: 0 },
      { id: 3, name: 'Omar Tarek', address: 'El Obour City', phoneNumber: '01244556677', totalDebt: 240 }
    ],
    payments: [
      { id: 200, customerId: 1, amount: 80, paymentDate: '2026-11-24T13:20:00Z', note: 'دفعة جزئية' }
    ],
    cart: [{ medicineId: 1, quantity: 2 }],
    invoices: []
  };
}

function pharmacyReset() {
  pharmacyInitData();
  pharmacyRenderAll();
  pharmacyLogRequest('POST /api/seed/reset', 200, {
    message: 'PostgreSQL seed database reset cleanly',
    medicinesCount: pharmaState.medicines.length,
    customersCount: pharmaState.customers.length
  });
}

function pharmacyTab(tab, btn) {
  document.querySelectorAll('#panel-pharmacy .sim-subtab').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  ['medicines', 'invoices', 'customers'].forEach((t) => {
    document.getElementById('pharma-tab-' + t).style.display = t === tab ? 'block' : 'none';
  });
}

function pharmacyPulsePipeline(isError = false) {
  const steps = document.querySelectorAll('#pharma-pipeline .arch-step');
  steps.forEach((s) => s.classList.remove('lit'));
  steps.forEach((step, idx) => {
    setTimeout(() => {
      if (!isError || idx < 3) step.classList.add('lit');
    }, idx * 90);
  });
}

function pharmacyLogRequest(endpoint, statusCode, payload, requestBody = null) {
  const badge = document.getElementById('pharma-http-status');
  const reqLine = document.getElementById('pharma-req-line');
  const consoleEl = document.getElementById('pharma-console');
  badge.className = 'http-badge ' + (statusCode >= 404 ? 'http-404' : statusCode >= 400 ? 'http-400' : 'http-200');
  badge.textContent = statusCode === 200 ? '200 OK' : statusCode === 204 ? '204 NoContent' : statusCode === 400 ? '400 BadRequest' : '404 NotFound';
  reqLine.textContent = endpoint;
  pharmacyPulsePipeline(statusCode >= 400);

  let output = '';
  if (requestBody) {
    output += `// Request DTO\n${JSON.stringify(requestBody, null, 2)}\n\n`;
  }
  output += `// Response (${statusCode})\n${JSON.stringify(payload, null, 2)}`;
  consoleEl.textContent = output;
}

function pharmacyRenderMeds(list = pharmaState.medicines) {
  const tbody = document.getElementById('pharma-meds-body');
  tbody.innerHTML = list.map((m) => `
    <tr>
      <td>#${m.id}</td>
      <td><code>${m.code}</code></td>
      <td><strong>${m.name}</strong></td>
      <td>${m.price} EGP</td>
      <td><span class="http-badge ${m.quantity <= 5 ? 'http-400' : 'http-200'}">${m.quantity}</span></td>
      <td style="display:flex;gap:0.3rem;">
        <button class="sim-btn" style="padding:0.25rem 0.45rem;" onclick="pharmacyRestock(${m.id})">+5</button>
        <button class="sim-btn warn" style="padding:0.25rem 0.45rem;" onclick="pharmacyDeleteMed(${m.id})">✕</button>
      </td>
    </tr>
  `).join('');

  const invSelect = document.getElementById('inv-med-select');
  invSelect.innerHTML = pharmaState.medicines.map((m) =>
    `<option value="${m.id}">${m.name} (${m.price} EGP · Stock: ${m.quantity})</option>`
  ).join('');
}

function pharmacySearch() {
  const q = document.getElementById('pharma-search').value.trim().toLowerCase();
  const filtered = q
    ? pharmaState.medicines.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
    : pharmaState.medicines;
  pharmacyRenderMeds(filtered);
  pharmacyLogRequest(`GET /api/medicines/search?query=${encodeURIComponent(q)}`, 200, filtered);
}

function pharmacyAddMedicine() {
  const name = document.getElementById('med-name').value.trim();
  const code = document.getElementById('med-code').value.trim();
  const price = parseFloat(document.getElementById('med-price').value);
  const quantity = parseInt(document.getElementById('med-qty').value, 10);
  if (!name || !code || isNaN(price) || isNaN(quantity)) {
    return pharmacyLogRequest('POST /api/medicines', 400, {
      statusCode: 400,
      message: 'يرجى إدخال اسم الدواء والكود والسعر والكمية بشكل صحيح'
    });
  }
  const med = { id: pharmaState.nextMedId++, name, code, price, quantity };
  pharmaState.medicines.push(med);
  document.getElementById('med-name').value = '';
  document.getElementById('med-code').value = '';
  document.getElementById('med-price').value = '';
  document.getElementById('med-qty').value = '';
  pharmacyRenderMeds();
  pharmacyLogRequest('POST /api/medicines', 200, med, { name, code, price, quantity });
}

function pharmacyRestock(id) {
  const med = pharmaState.medicines.find((m) => m.id === id);
  if (!med) return;
  med.quantity += 5;
  pharmacyRenderMeds();
  pharmacyLogRequest(`PUT /api/medicines/${id}`, 200, med, {
    name: med.name,
    code: med.code,
    price: med.price,
    quantity: med.quantity
  });
}

function pharmacyDeleteMed(id) {
  pharmaState.medicines = pharmaState.medicines.filter((m) => m.id !== id);
  pharmaState.cart = pharmaState.cart.filter((c) => c.medicineId !== id);
  pharmacyRenderAll();
  pharmacyLogRequest(`DELETE /api/medicines/${id}`, 204, { deletedId: id });
}

function pharmacyRenderCart() {
  const tbody = document.getElementById('pharma-cart-body');
  let total = 0;
  tbody.innerHTML = pharmaState.cart.map((item, idx) => {
    const med = pharmaState.medicines.find((m) => m.id === item.medicineId);
    if (!med) return '';
    const line = med.price * item.quantity;
    total += line;
    return `
      <tr>
        <td>${med.name}</td>
        <td>${med.price} EGP</td>
        <td>${item.quantity}</td>
        <td><strong>${line} EGP</strong></td>
        <td><button class="sim-btn warn" style="padding:0.2rem 0.45rem;" onclick="pharmacyRemoveCart(${idx})">✕</button></td>
      </tr>
    `;
  }).join('');
  document.getElementById('pharma-cart-summary').textContent = `TotalAmount: ${total} EGP`;
}

function pharmacyAddToCart() {
  const medId = parseInt(document.getElementById('inv-med-select').value, 10);
  const qty = parseInt(document.getElementById('inv-med-qty').value, 10) || 1;
  const existing = pharmaState.cart.find((c) => c.medicineId === medId);
  if (existing) existing.quantity += qty;
  else pharmaState.cart.push({ medicineId: medId, quantity: qty });
  pharmacyRenderCart();
}

function pharmacyRemoveCart(idx) {
  pharmaState.cart.splice(idx, 1);
  pharmacyRenderCart();
}

function pharmacyCreateInvoice() {
  const customerId = parseInt(document.getElementById('inv-customer').value, 10);
  const invoiceNumber = document.getElementById('inv-number').value.trim() || `INV-${pharmaState.nextInvId}`;
  const paidAmount = Math.max(0, parseFloat(document.getElementById('inv-paid').value) || 0);
  const customer = pharmaState.customers.find((c) => c.id === customerId);

  const reqPayload = {
    invoiceNumber,
    customerId,
    paidAmount,
    note: 'POS Transaction',
    items: pharmaState.cart.map((i) => ({ medicineId: i.medicineId, quantity: i.quantity }))
  };

  if (!customer) {
    return pharmacyLogRequest('POST /api/invoices', 404, { statusCode: 404, message: 'العميل غير موجود' }, reqPayload);
  }
  if (pharmaState.cart.length === 0) {
    return pharmacyLogRequest('POST /api/invoices', 400, { statusCode: 400, message: 'الفاتورة لا تحتوي على أصناف' }, reqPayload);
  }

  // Simulate atomic EF Core DB Transaction check before commit
  let totalAmount = 0;
  const detailsItems = [];
  for (const item of pharmaState.cart) {
    const med = pharmaState.medicines.find((m) => m.id === item.medicineId);
    if (!med) {
      return pharmacyLogRequest('POST /api/invoices', 404, {
        statusCode: 404,
        message: `الدواء رقم ${item.medicineId} غير موجود`
      }, reqPayload);
    }
    if (med.quantity < item.quantity) {
      return pharmacyLogRequest('POST /api/invoices', 400, {
        statusCode: 400,
        message: `الكمية غير كافية للدواء: ${med.name}`
      }, reqPayload);
    }
    totalAmount += med.price * item.quantity;
    detailsItems.push({
      medicineId: med.id,
      medicineName: med.name,
      quantity: item.quantity,
      unitPrice: med.price,
      lineTotal: med.price * item.quantity
    });
  }

  // Commit atomic changes
  for (const item of pharmaState.cart) {
    const med = pharmaState.medicines.find((m) => m.id === item.medicineId);
    med.quantity -= item.quantity;
  }
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  customer.totalDebt += remainingAmount;

  const invoiceDto = {
    id: pharmaState.nextInvId++,
    invoiceNumber,
    customerId,
    customerName: customer.name,
    createdAtDateTime: new Date().toISOString(),
    totalAmount,
    paidAmount,
    remainingAmount,
    items: detailsItems
  };
  pharmaState.invoices.unshift(invoiceDto);
  pharmaState.cart = [];
  document.getElementById('inv-number').value = `INV-2026-${pharmaState.nextInvId}`;
  pharmacyRenderAll();
  pharmacyLogRequest('POST /api/invoices [Atomic DB Transaction Committed]', 200, invoiceDto, reqPayload);
}

function pharmacySimulateError(type) {
  if (type === 'stock') {
    pharmacyLogRequest('POST /api/invoices [Transaction Rolled Back]', 400, {
      statusCode: 400,
      message: `الكمية غير كافية للدواء: ${pharmaState.medicines[0]?.name || 'Panadol Extra'}`
    });
  } else {
    pharmacyLogRequest('GET /api/medicines/9999 [ExceptionHandlingMiddleware]', 404, {
      statusCode: 404,
      message: 'الدواء غير موجود'
    });
  }
}

function pharmacyRenderCustomers() {
  const tbody = document.getElementById('pharma-custs-body');
  const invCust = document.getElementById('inv-customer');
  invCust.innerHTML = pharmaState.customers.map((c) =>
    `<option value="${c.id}">${c.name} (Debt: ${c.totalDebt} EGP)</option>`
  ).join('');

  tbody.innerHTML = pharmaState.customers.map((c) => `
    <tr>
      <td>#${c.id}</td>
      <td><strong>${c.name}</strong><div style="font-size:0.72rem;color:var(--text-muted);">${c.address}</div></td>
      <td>${c.phoneNumber}</td>
      <td><span class="http-badge ${c.totalDebt > 0 ? 'http-400' : 'http-200'}">${c.totalDebt} EGP</span></td>
      <td>
        <button class="sim-btn success" style="padding:0.28rem 0.55rem;" onclick="pharmacyPayDebt(${c.id}, 50)">Pay 50 EGP</button>
      </td>
    </tr>
  `).join('');

  const logEl = document.getElementById('pharma-payments-log');
  const recent = pharmaState.payments.slice(-4).reverse();
  logEl.innerHTML = recent.map((p) => {
    const cust = pharmaState.customers.find((c) => c.id === p.customerId);
    return `• [${p.paymentDate.slice(0, 16).replace('T', ' ')}] ${cust?.name || 'Customer'} paid <strong>${p.amount} EGP</strong> (${p.note})`;
  }).join('<br/>');
}

function pharmacyAddCustomer() {
  const name = document.getElementById('cust-name').value.trim();
  const phoneNumber = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-addr').value.trim() || 'Egypt';
  if (!name || !phoneNumber) {
    return pharmacyLogRequest('POST /api/customers', 400, { statusCode: 400, message: 'الاسم ورقم الهاتف مطلوبان' });
  }
  const c = { id: pharmaState.nextCustId++, name, address, phoneNumber, totalDebt: 0 };
  pharmaState.customers.push(c);
  document.getElementById('cust-name').value = '';
  document.getElementById('cust-phone').value = '';
  document.getElementById('cust-addr').value = '';
  pharmacyRenderCustomers();
  pharmacyLogRequest('POST /api/customers', 200, c, { name, address, phoneNumber });
}

function pharmacyPayDebt(id, amount) {
  const cust = pharmaState.customers.find((c) => c.id === id);
  if (!cust) return;
  cust.totalDebt = Math.max(0, cust.totalDebt - amount);
  const payment = {
    id: pharmaState.nextPayId++,
    customerId: id,
    amount,
    paymentDate: new Date().toISOString(),
    note: 'سداد من المحاكي'
  };
  pharmaState.payments.push(payment);
  pharmacyRenderCustomers();
  pharmacyLogRequest(`POST /api/customers/${id}/pay-debt?amount=${amount}`, 200, {
    message: 'تم تسجيل سداد الدفعة بنجاح',
    remainingTotalDebt: cust.totalDebt,
    payment
  });
}

function pharmacyRenderAll() {
  pharmacyRenderMeds();
  pharmacyRenderCart();
  pharmacyRenderCustomers();
}

/* ══════════════════════════════════════════════════
   2. SIGNALR CHATAPP (.NET WEBSOCKET HUB)
   ══════════════════════════════════════════════════ */
const signalrMessages = [
  { user: 'Kareem', text: 'Welcome to SignalR-ChatApp! Messages persist to EF Core ChatDbContext.' },
  { user: 'Guest', text: 'Awesome! Testing real-time Clients.All.SendAsync("ReceiveMessage").' }
];

function signalrRender(trace = 'Hub Connected -> Replayed 2 persisted messages via OnConnectedAsync()') {
  const renderList = (elId, selfName) => {
    const el = document.getElementById(elId);
    el.innerHTML = signalrMessages.map((m) => `
      <div class="chat-bubble ${m.user === selfName ? 'me' : 'other'}">
        <div style="font-size:0.68rem;opacity:0.75;margin-bottom:2px;">${m.user}</div>
        <div>${m.text}</div>
      </div>
    `).join('');
    el.scrollTop = el.scrollHeight;
  };
  renderList('signalr-msgs-a', 'Kareem');
  renderList('signalr-msgs-b', 'Guest');

  document.getElementById('signalr-console').textContent =
`// ChatHub.cs (ASP.NET Core SignalR + EF Core)
[HubMethod] SendMessage(string userName, string message)
Last Event: ${trace}

// Persisted ChatDbContext.Messages (${signalrMessages.length} rows)
${JSON.stringify(signalrMessages.slice(-4), null, 2)}`;
}

function signalrSend(user, inputKey) {
  const input = document.getElementById('signalr-input-' + inputKey);
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  signalrMessages.push({ user, text });
  signalrRender(`Clients.All.SendAsync("ReceiveMessage", "${user}", "${text}")`);
}

function signalrReplay() {
  signalrRender(`OnConnectedAsync() replayed ${signalrMessages.length} messages to Caller.`);
}

/* ══════════════════════════════════════════════════
   3. ETMAN-APP (TABEBAK HEALTHCARE + AI)
   ══════════════════════════════════════════════════ */
const etmanDoctors = [
  { name: 'Dr. Ahmed Mahmoud', spec: 'Cardiology', hospital: 'Cairo Univ. Hospital', time: '06:30 PM' },
  { name: 'Dr. Fatma Ali', spec: 'Pediatrics', hospital: 'Al Salam Int. Hospital', time: '07:15 PM' },
  { name: 'Dr. Omar Sayed', spec: 'Orthopedics', hospital: 'Dar Al Fouad', time: '08:00 PM' }
];
const etmanBookings = [];

function etmanRender() {
  const role = document.getElementById('etman-role').value;
  const screen = document.getElementById('etman-screen');
  if (role === 'patient') {
    screen.innerHTML = `
      <div style="font-size:0.76rem;color:var(--text-muted);margin-bottom:0.5rem;">12 Specialties · Book Appointment</div>
      ${etmanDoctors.map((d, idx) => `
        <div style="padding:0.65rem;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);margin-bottom:0.55rem;">
          <div style="font-weight:700;font-size:0.86rem;">${d.name}</div>
          <div style="font-size:0.74rem;color:var(--neon-cyan);">${d.spec} · ${d.hospital}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.45rem;">
            <span style="font-size:0.72rem;color:var(--text-muted);">Next: ${d.time}</span>
            <button class="sim-btn success" style="padding:0.26rem 0.6rem;" onclick="etmanBook(${idx})">Book</button>
          </div>
        </div>
      `).join('')}
      <div style="font-size:0.74rem;color:var(--neon-green);margin-top:0.4rem;">Booked: ${etmanBookings.length} appointment(s)</div>
    `;
  } else if (role === 'doctor') {
    screen.innerHTML = `
      <div style="font-size:0.78rem;color:var(--neon-purple);margin-bottom:0.5rem;">Doctor Dashboard — Incoming Queue</div>
      ${etmanBookings.length === 0 ? '<div style="font-size:0.8rem;color:var(--text-muted);">No patient bookings yet. Switch to Patient and book a slot!</div>' :
        etmanBookings.map((b) => `
          <div style="padding:0.6rem;border-radius:10px;background:rgba(191,90,242,0.1);border:1px solid rgba(191,90,242,0.3);margin-bottom:0.5rem;font-size:0.8rem;">
            <strong>${b.doctor}</strong> (${b.spec})<br/>Slot: ${b.time} · Status: Confirmed
          </div>
        `).join('')}
    `;
  } else {
    screen.innerHTML = `
      <div style="font-size:0.78rem;color:var(--neon-green);margin-bottom:0.5rem;">Partner Pharmacies (El Ezaby / Seif / Roshdy)</div>
      <div style="padding:0.65rem;border-radius:10px;background:rgba(48,209,88,0.09);border:1px solid rgba(48,209,88,0.3);font-size:0.79rem;margin-bottom:0.5rem;">
        <strong>El Ezaby Pharmacy</strong><br/>24/7 Delivery · Prescription Sync Ready
      </div>
      <div style="padding:0.65rem;border-radius:10px;background:rgba(0,245,255,0.07);border:1px solid rgba(0,245,255,0.25);font-size:0.79rem;">
        <strong>19011 &amp; Seif Pharmacy</strong><br/>Live Medication Fulfillment Active
      </div>
    `;
  }
}

function etmanBook(idx) {
  const d = etmanDoctors[idx];
  etmanBookings.push({ doctor: d.name, spec: d.spec, time: d.time });
  etmanRender();
  document.getElementById('etman-console').textContent = JSON.stringify({
    service: 'AppointmentService -> Firebase Cloud Firestore',
    event: 'APPOINTMENT_CONFIRMED',
    doctor: d.name,
    specialty: d.spec,
    slot: d.time,
    notification: 'FCM Push Notification dispatched to Patient & Doctor'
  }, null, 2);
}

function etmanAskAI() {
  const input = document.getElementById('etman-ai-input');
  const q = input.value.trim();
  if (!q) return;
  const lower = q.toLowerCase();
  let advice = 'Preliminary AI Triage: Stay hydrated, monitor vital signs, and book a Family Medicine specialist if symptoms persist over 48 hours.';
  let recSpec = 'Family Medicine';
  if (lower.includes('chest') || lower.includes('heart')) {
    advice = 'Urgent Flag: Chest discomfort should be evaluated promptly by a Cardiologist or Emergency Unit.';
    recSpec = 'Cardiology';
  } else if (lower.includes('fever') || lower.includes('throat')) {
    advice = 'Preliminary Assessment: Rest, hydration, and temperature monitoring. Recommended specialist: ENT or Internal Medicine.';
    recSpec = 'ENT';
  }
  document.getElementById('etman-console').textContent = JSON.stringify({
    provider: 'GeminiService / DeepSeekService',
    symptomInput: q,
    recommendedSpecialty: recSpec,
    aiAssessment: advice
  }, null, 2);
  input.value = '';
}

/* ══════════════════════════════════════════════════
   4. ENTERPRISE E-COMMERCE (CLEAN ARCHITECTURE)
   ══════════════════════════════════════════════════ */
const ecomCatalog = [
  { id: 1, name: 'Mechanical Keyboard RGB', price: 2450, stock: 8 },
  { id: 2, name: '4K USB-C Hub Pro', price: 1350, stock: 12 },
  { id: 3, name: 'Noise-Cancel Headset', price: 3200, stock: 5 },
  { id: 4, name: 'Ergonomic Laptop Stand', price: 890, stock: 15 }
];
let ecomCart = [];
let ecomJwtValid = true;
let ecomRevenue = 0;

function ecomToggleAuth() {
  ecomJwtValid = !ecomJwtValid;
  const badge = document.getElementById('ecom-auth-badge');
  badge.className = 'http-badge ' + (ecomJwtValid ? 'http-200' : 'http-404');
  badge.textContent = ecomJwtValid ? 'JWT: Authenticated' : 'JWT: Missing / 401';
}

function ecomRender() {
  const q = document.getElementById('ecom-search').value.trim().toLowerCase();
  const list = ecomCatalog.filter((p) => p.name.toLowerCase().includes(q));
  document.getElementById('ecom-products').innerHTML = list.map((p) => `
    <div style="padding:0.75rem;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
      <div style="font-weight:700;font-size:0.84rem;margin-bottom:0.25rem;">${p.name}</div>
      <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--neon-cyan);margin-bottom:0.45rem;">${p.price} EGP · Stock: ${p.stock}</div>
      <button class="sim-btn" style="width:100%;" onclick="ecomAdd(${p.id})">+ Add to Cart</button>
    </div>
  `).join('');
  const total = ecomCart.reduce((s, x) => s + x.price, 0);
  document.getElementById('ecom-cart-info').textContent = `Cart: ${ecomCart.length} items (${total} EGP)`;
  document.getElementById('ecom-kpi').textContent = `Revenue: ${ecomRevenue} EGP`;
}

function ecomAdd(id) {
  const p = ecomCatalog.find((x) => x.id === id);
  if (p && p.stock > 0) ecomCart.push(p);
  ecomRender();
}

function ecomCheckout() {
  const consoleEl = document.getElementById('ecom-console');
  if (!ecomJwtValid) {
    consoleEl.textContent = JSON.stringify({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Valid Bearer JWT token required for [Authorize] OrdersController.Checkout()'
    }, null, 2);
    return;
  }
  if (ecomCart.length === 0) {
    consoleEl.textContent = JSON.stringify({ statusCode: 400, message: 'Cart is empty.' }, null, 2);
    return;
  }
  const total = ecomCart.reduce((s, x) => s + x.price, 0);
  ecomCart.forEach((item) => {
    const prod = ecomCatalog.find((p) => p.id === item.id);
    if (prod && prod.stock > 0) prod.stock -= 1;
  });
  ecomRevenue += total;
  const order = {
    orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    status: 'Paid -> Dispatched',
    itemsCount: ecomCart.length,
    totalAmount: total,
    awardBadge: '3rd Place Clean Architecture Engine'
  };
  ecomCart = [];
  ecomRender();
  consoleEl.textContent = JSON.stringify(order, null, 2);
}

/* ══════════════════════════════════════════════════
   5. OBOUR CS HUB (ACADEMIC PORTAL)
   ══════════════════════════════════════════════════ */
const obourResources = [
  { course: 'Data Structures & Algorithms', level: 'L2', type: 'Summary PDF + 4 Past Exams', summary: 'Covers Trees, Graphs, BFS/DFS, Dijkstra, and Big-O complexity proofs.' },
  { course: 'Database Systems (SQL)', level: 'L2', type: 'ER Diagrams + Midterm Bank', summary: 'Normalization (1NF-BCNF), Relational Algebra, Joins, and Indexing.' },
  { course: 'Software Engineering & Clean Arch', level: 'L3', type: 'Lecture Notes + UML Pack', summary: 'SOLID principles, Repository/UnitOfWork, Domain modeling, and Testing.' },
  { course: 'Distributed Cloud Systems', level: 'L4', type: 'Docker + Microservices Lab', summary: 'Container orchestration, API Gateways, caching, and Supabase integration.' }
];

function obourRender() {
  const lvl = document.getElementById('obour-level').value;
  const q = document.getElementById('obour-search').value.trim().toLowerCase();
  const rows = obourResources.filter((r) => (lvl === 'all' || r.level === lvl) && r.course.toLowerCase().includes(q));
  document.getElementById('obour-body').innerHTML = rows.map((r, idx) => `
    <tr>
      <td><strong>${r.course}</strong></td>
      <td><span class="http-badge http-200">${r.level}</span></td>
      <td>${r.type}</td>
      <td><button class="sim-btn" onclick="obourPreview(${obourResources.indexOf(r)})">Inspect</button></td>
    </tr>
  `).join('');
}

function obourPreview(idx) {
  const r = obourResources[idx];
  document.getElementById('obour-console').textContent = JSON.stringify({
    portal: 'Obour CS Hub',
    course: r.course,
    level: r.level,
    resourceType: r.type,
    highlights: r.summary,
    keepaliveCron: '0 0 */3 * * -> Supabase Storage Ping 200 OK'
  }, null, 2);
}

/* ══════════════════════════════════════════════════
   6. TASKATI-APP (FLUTTER TIMELINE)
   ══════════════════════════════════════════════════ */
const taskDays = ['Wed 25', 'Thu 26', 'Fri 27', 'Sat 28', 'Sun 29'];
let selectedTaskDay = 'Wed 25';
let taskatiTasks = JSON.parse(localStorage.getItem('ky_taskati_tasks') || 'null') || [
  { id: 1, day: 'Wed 25', title: 'Review PharmacySystem PR', note: 'Verify Clean Arch DI bindings', time: '02:00 PM - 03:00 PM', color: '#00f5ff', done: true },
  { id: 2, day: 'Wed 25', title: 'GDG Partnership Call', note: 'Finalize tech sponsor deck', time: '06:00 PM - 07:00 PM', color: '#ffd60a', done: false }
];

function taskatiSave() {
  localStorage.setItem('ky_taskati_tasks', JSON.stringify(taskatiTasks));
}

function taskatiRender() {
  document.getElementById('taskati-days').innerHTML = taskDays.map((d) => `
    <button class="sim-subtab ${d === selectedTaskDay ? 'active' : ''}" style="padding:0.35rem 0.65rem;font-size:0.72rem;" onclick="selectedTaskDay='${d}';taskatiRender();">${d}</button>
  `).join('');

  const filtered = taskatiTasks.filter((t) => t.day === selectedTaskDay);
  document.getElementById('taskati-count').textContent = `${filtered.length} Tasks`;
  document.getElementById('taskati-list').innerHTML = filtered.map((t) => `
    <div style="padding:0.65rem;border-radius:12px;background:rgba(255,255,255,0.04);border-left:4px solid ${t.color};display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
      <div style="opacity:${t.done ? 0.55 : 1};text-decoration:${t.done ? 'line-through' : 'none'};">
        <div style="font-weight:700;font-size:0.84rem;">${t.title}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);">${t.time} · ${t.note}</div>
      </div>
      <div style="display:flex;gap:0.3rem;">
        <button class="sim-btn success" style="padding:0.22rem 0.45rem;" onclick="taskatiToggle(${t.id})">✓</button>
        <button class="sim-btn warn" style="padding:0.22rem 0.45rem;" onclick="taskatiDelete(${t.id})">✕</button>
      </div>
    </div>
  `).join('') || '<div style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:1rem;">No tasks scheduled for this day.</div>';

  document.getElementById('taskati-console').textContent =
`// shared_preferences JSON state
${JSON.stringify(taskatiTasks, null, 2)}`;
}

function taskatiAdd() {
  const title = document.getElementById('task-title').value.trim();
  const note = document.getElementById('task-note').value.trim() || 'Flutter Task';
  const time = document.getElementById('task-time').value.trim();
  const color = document.getElementById('task-color').value;
  if (!title) return;
  taskatiTasks.push({ id: Date.now(), day: selectedTaskDay, title, note, time, color, done: false });
  document.getElementById('task-title').value = '';
  document.getElementById('task-note').value = '';
  taskatiSave();
  taskatiRender();
}

function taskatiToggle(id) {
  const t = taskatiTasks.find((x) => x.id === id);
  if (t) t.done = !t.done;
  taskatiSave();
  taskatiRender();
}

function taskatiDelete(id) {
  taskatiTasks = taskatiTasks.filter((x) => x.id !== id);
  taskatiSave();
  taskatiRender();
}

/* ══════════════════════════════════════════════════
   7. SAHLTAHALAK (STUDY TIMER & DHIKR PWA)
   ══════════════════════════════════════════════════ */
let sahlMode = 'timer';
let sahlTotalSec = 25 * 60;
let sahlRemaining = 25 * 60;
let sahlElapsed = 0;
let sahlInterval = null;
const SAHL_CIRCUMFERENCE = 2 * Math.PI * 90;

const dhikrSeed = [
  { text: 'سبحان الله وبحمده', initial: 100, count: 100 },
  { text: 'أستغفر الله العظيم وأتوب إليه', initial: 100, count: 100 },
  { text: 'اللهم صل وسلم على نبينا محمد', initial: 10, count: 10 },
  { text: 'سبحان الله العظيم', initial: 100, count: 100 },
  { text: 'لا إله إلا الله وحده لا شريك له', initial: 100, count: 100 }
];

function sahlUpdateDisplay() {
  const sec = sahlMode === 'timer' ? sahlRemaining : sahlElapsed;
  const mins = String(Math.floor(sec / 60)).padStart(2, '0');
  const rem = String(sec % 60).padStart(2, '0');
  document.getElementById('sahl-time').textContent = `${mins}:${rem}`;
  const ratio = sahlMode === 'timer' ? (sahlTotalSec > 0 ? sahlRemaining / sahlTotalSec : 0) : ((sahlElapsed % 60) / 60);
  const ring = document.getElementById('sahl-ring');
  ring.style.strokeDasharray = SAHL_CIRCUMFERENCE;
  ring.style.strokeDashoffset = SAHL_CIRCUMFERENCE * (1 - ratio);
}

function sahlStart() {
  if (sahlInterval) return;
  sahlInterval = setInterval(() => {
    if (sahlMode === 'timer') {
      if (sahlRemaining > 0) sahlRemaining--;
      else sahlPause();
    } else {
      sahlElapsed++;
    }
    sahlUpdateDisplay();
  }, 1000);
}

function sahlPause() {
  clearInterval(sahlInterval);
  sahlInterval = null;
}

function sahlReset() {
  sahlPause();
  sahlRemaining = sahlTotalSec;
  sahlElapsed = 0;
  sahlUpdateDisplay();
}

function sahlSetPreset(mins, btn) {
  document.querySelectorAll('#panel-sahltahalak .sim-subtab').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  sahlTotalSec = mins * 60;
  sahlReset();
}

function sahlToggleMode() {
  sahlPause();
  sahlMode = sahlMode === 'timer' ? 'stopwatch' : 'timer';
  document.getElementById('sahl-mode-btn').textContent = sahlMode === 'timer' ? 'Mode: Timer Focus' : 'Mode: Stopwatch';
  document.getElementById('sahl-label').textContent = sahlMode === 'timer' ? 'Timer Focus' : 'Stopwatch';
  sahlUpdateDisplay();
}

function sahlRenderDhikr() {
  document.getElementById('sahl-dhikr-list').innerHTML = dhikrSeed.map((d, idx) => `
    <div class="dhikr-row" onclick="sahlTapDhikr(${idx})">
      <span>${d.text}</span>
      <span class="http-badge ${d.count === 0 ? 'http-200' : 'http-400'}">${d.count}</span>
    </div>
  `).join('');
}

function sahlTapDhikr(idx) {
  if (dhikrSeed[idx].count > 0) dhikrSeed[idx].count--;
  sahlRenderDhikr();
}

function sahlResetDhikr() {
  dhikrSeed.forEach((d) => (d.count = d.initial));
  sahlRenderDhikr();
}

/* ── Boot All Simulators ── */
pharmacyInitData();
pharmacyRenderAll();
pharmacyLogRequest('GET /api/medicines [Seed Ready]', 200, pharmaState.medicines);
signalrRender();
etmanRender();
document.getElementById('etman-console').textContent = JSON.stringify({
  app: 'Etman-App (Tabebak)',
  roles: ['Patient', 'Doctor', 'Pharmacy', 'Lab', 'Nurse', 'Admin'],
  aiServices: ['GeminiService', 'DeepSeekService', 'DoctorAiService']
}, null, 2);
ecomRender();
document.getElementById('ecom-console').textContent = JSON.stringify({
  project: 'Enterprise E-Commerce (3rd Place Award)',
  layers: ['Domain', 'Application', 'Infrastructure', 'WebAPI'],
  auth: 'JWT Bearer Ready'
}, null, 2);
obourRender();
obourPreview(0);
taskatiRender();
sahlUpdateDisplay();
sahlRenderDhikr();
