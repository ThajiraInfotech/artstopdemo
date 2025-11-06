import api from './api';

// Payment service for Razorpay integration
class PaymentService {
  // Create Razorpay order
  async createRazorpayOrder(shippingAddress) {
    try {
      const response = await api.post('/api/payments/create-order', {
        shippingAddress
      });

      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create payment order',
        error: error.response?.data || error.message
      };
    }
  }

  // Verify payment
  async verifyPayment(paymentData) {
    try {
      const response = await api.post('/api/payments/verify', paymentData);

      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Payment verification failed',
        error: error.response?.data || error.message
      };
    }
  }

  // Process refund
  async processRefund(orderId, reason, amount = null) {
    try {
      const response = await api.post('/api/payments/refund', {
        orderId,
        reason,
        amount
      });

      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Refund processing failed',
        error: error.response?.data || error.message
      };
    }
  }

  // Get payment details
  async getPaymentDetails(orderId) {
    try {
      const response = await api.get(`/api/payments/${orderId}`);

      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get payment details',
        error: error.response?.data || error.message
      };
    }
  }

  // Initialize Razorpay checkout
  initializeRazorpay(options) {
    return new Promise((resolve, reject) => {
      // Check if Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      // Suppress common test environment errors
      const originalConsoleError = console.error;
      console.error = function(...args) {
        // Filter out known test environment errors
        const errorMessage = args.join(' ');
        if (
          errorMessage.includes('serviceworker') ||
          errorMessage.includes('Expected length') ||
          errorMessage.includes('Failed to launch') ||
          errorMessage.includes('400 (Bad Request)') ||
          errorMessage.includes('gpay://upi/pay')
        ) {
          return; // Suppress these errors
        }
        originalConsoleError.apply(console, args);
      };

      const rzp = new window.Razorpay({
        key: options.key,
        amount: options.amount,
        currency: options.currency,
        name: 'ArtStop',
        description: 'Payment for your order',
        image: '/artstoplogo.png', // Update with your logo path
        order_id: options.razorpayOrderId,
        handler: function (response) {
          // Restore console.error after payment completion
          console.error = originalConsoleError;
          resolve({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        },
        prefill: {
          name: options.customerName,
          email: options.customerEmail,
          contact: options.customerPhone
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            // Restore console.error on dismiss
            console.error = originalConsoleError;
            reject(new Error('Payment cancelled by user'));
          },
          confirm_close: true,
          escape: false,
          backdropclose: false
        }
      });

      // Add shipping address form to Razorpay modal
      rzp.on('ready', function() {
        // Create shipping address form
        const shippingForm = document.createElement('div');
        shippingForm.innerHTML = `
          <div id="shipping-form" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
          ">
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 24px; font-weight: bold;">Shipping Details</h3>
            <form id="shipping-details-form">
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Full Name *</label>
                <input type="text" id="shipping-name" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" placeholder="Enter your full name">
              </div>
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Phone Number *</label>
                <input type="tel" id="shipping-phone" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" placeholder="Enter your phone number">
              </div>
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Email Address *</label>
                <input type="email" id="shipping-email" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" placeholder="Enter your email address">
              </div>
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Street Address *</label>
                <input type="text" id="shipping-street" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" placeholder="Enter your street address">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div>
                  <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">City *</label>
                  <input type="text" id="shipping-city" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" placeholder="City">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">State *</label>
                  <input type="text" id="shipping-state" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" placeholder="State">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">ZIP Code *</label>
                  <input type="text" id="shipping-zip" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" placeholder="ZIP">
                </div>
              </div>
              <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="button" id="cancel-shipping" style="flex: 1; padding: 12px; background: #f5f5f5; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Cancel</button>
                <button type="submit" id="proceed-payment" style="flex: 1; padding: 12px; background: #3399cc; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Proceed to Payment</button>
              </div>
            </form>
          </div>
        `;

        // Add form to page
        document.body.appendChild(shippingForm);

        // Handle form submission
        const form = document.getElementById('shipping-details-form');
        const proceedBtn = document.getElementById('proceed-payment');
        const cancelBtn = document.getElementById('cancel-shipping');

        form.addEventListener('submit', function(e) {
          e.preventDefault();

          const shippingData = {
            name: document.getElementById('shipping-name').value.trim(),
            phone: document.getElementById('shipping-phone').value.trim(),
            email: document.getElementById('shipping-email').value.trim(),
            street: document.getElementById('shipping-street').value.trim(),
            city: document.getElementById('shipping-city').value.trim(),
            state: document.getElementById('shipping-state').value.trim(),
            zipCode: document.getElementById('shipping-zip').value.trim()
          };

          // Validate required fields
          const requiredFields = ['name', 'phone', 'email', 'street', 'city', 'state', 'zipCode'];
          const missingFields = requiredFields.filter(field => !shippingData[field]);

          if (missingFields.length > 0) {
            alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
          }

          // Validate email
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingData.email)) {
            alert('Please enter a valid email address');
            return;
          }

          // Validate phone
          if (shippingData.phone.length < 10) {
            alert('Please enter a valid phone number');
            return;
          }

          // Store shipping data and close form
          options.shippingAddress = shippingData;
          document.body.removeChild(shippingForm);
          rzp.open();
        });

        cancelBtn.addEventListener('click', function() {
          // Restore console.error on cancel
          console.error = originalConsoleError;
          document.body.removeChild(shippingForm);
          reject(new Error('Shipping form cancelled'));
        });
      });

      // Don't open immediately - wait for shipping form
    });
  }

  // Load Razorpay script
  loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
  }

  // Process payment with Razorpay
  async processPayment(orderData, customerInfo) {
    try {
      // Load Razorpay script
      await this.loadRazorpayScript();

      // Create order with shipping address
      const orderResponse = await this.createRazorpayOrder({
        ...orderData,
        shippingAddress: orderData.shippingAddress || {}
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      const { orderId, razorpayOrderId, amount, currency, key } = orderResponse.data || orderResponse;

      // Initialize Razorpay checkout with shipping form
      const paymentResponse = await this.initializeRazorpay({
        key,
        amount,
        currency,
        razorpayOrderId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone
      });

      // Verify payment
      const verificationResponse = await this.verifyPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        orderId
      });

      if (!verificationResponse.success) {
        throw new Error(verificationResponse.message);
      }

      return {
        success: true,
        data: verificationResponse.data || verificationResponse,
        message: verificationResponse.message
      };

    } catch (error) {
      return {
        success: false,
        message: error.message || 'Payment processing failed',
        error
      };
    }
  }
}

const paymentService = new PaymentService();
export default paymentService;