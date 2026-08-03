/*==========================================================
BOOKING FORM DYNAMIC FIELDS
==========================================================*/

const serviceSelect = document.getElementById("service");

const dynamicFields = document.getElementById("dynamicFields");

if (serviceSelect) {

    serviceSelect.addEventListener("change", () => {

        const service = serviceSelect.value;

        dynamicFields.innerHTML = "";

        switch (service) {

            case "flight":

                dynamicFields.innerHTML = `

                    <div class="form-grid">

                        <div class="form-group">

                            <label>Flight Class</label>

                            <select id="flightClass">

                                <option>Economy</option>

                                <option>Business</option>

                                <option>First Class</option>

                            </select>

                        </div>

                        <div class="form-group">

                            <label>Trip Type</label>

                            <select id="tripType">

                                <option>Round Trip</option>

                                <option>One Way</option>

                            </select>

                        </div>

                    </div>

                `;

                break;

            case "hotel":

                dynamicFields.innerHTML = `

                    <div class="form-grid">

                        <div class="form-group">

                            <label>Hotel Stars</label>

                            <select id="hotelStars">

                                <option>3 Stars</option>

                                <option>4 Stars</option>

                                <option>5 Stars</option>

                            </select>

                        </div>

                        <div class="form-group">

                            <label>Number of Nights</label>

                            <input type="number" id="nights" min="1" value="1">

                        </div>

                    </div>

                `;

                break;

            case "visa":

                dynamicFields.innerHTML = `

                    <div class="form-group">

                        <label>Visa Type</label>

                        <select id="visaType">

                            <option>Tourist</option>

                            <option>Business</option>

                            <option>Work</option>

                            <option>Study</option>

                        </select>

                    </div>

                `;

                break;

            case "security":

                dynamicFields.innerHTML = `

                    <div class="form-group">

                        <label>Security Clearance Type</label>

                        <select id="securityType">

                            <option>National Security</option>

                            <option>Military Security</option>

                        </select>

                    </div>

                `;

                break;

        }

    });

}
