const { db } = require('../config/firebase');

class FacilityService {
    async checkFacilityAvailability(vesselVisitRequest) {
        const { imoNumber, loa, draft, cargoType, eta, etd } = vesselVisitRequest;

        // Convert eta and etd to Date objects
        const etaDate = new Date(eta);
        const etdDate = new Date(etd);

        // Helper function to check if assets are available during a time range
        function isBerthAvailable(facility, eta, etd) {
            for (const [key, period] of Object.entries(facility.bookedPeriod)) {
                const [bookedEta, bookedEtd] = period.map(date => new Date(date));
                // If the asset's booked period overlaps with the requested period, it's unavailable
                if (
                    !(
                        etd <= bookedEta ||
                        eta >= bookedEtd
                    )
                ) {
                    console.log(
                        "Berth " +
                        facility.name +
                        " is not available because it has been reserved"
                    );
                    return false;
                }
            }
            return true;
        }

        // Step 1: Check the facilityList to find berths that match the vessel's LOA, draft, and cargoType
        const facilityListCollectionRef = db.collection("portConfigurations");
        const facilityListQuery = facilityListCollectionRef.where("type", "==", "berth");
        const facilityListSnapshot = await facilityListQuery.get();
        const matchedBerths = [];

        facilityListSnapshot.forEach((doc) => {
            const berth = doc.data();

            // Check if LOA, draft, and cargoType match
            if (
                loa <= berth.lengthCapacity &&
                draft <= berth.depthCapacity &&
                cargoType === berth.cargoType
            ) {
                matchedBerths.push(berth); // Store the matched berth
                console.log("Berth " + berth.name + " added to matchedBerths");
            }
        });

        if (matchedBerths.length === 0) {
            console.log("No berths match the vessel's requirements.");
            return {
                success: false,
                assignedBerth: "",
                adjustedEta: eta,
                adjustedEtd: etd,
            };
        }

        // Step 2: Loop through each matched berth and check whether it is available during the required hours
        for (const berth of matchedBerths) {
            if (isBerthAvailable(berth, etaDate, etdDate)) {
                console.log(
                    `Berth ${berth.name} is available for the entire time range.`
                );
            } else {
                const index = matchedBerths.findIndex((obj) => obj === berth);
                matchedBerths.splice(index, 1);
                console.log(`Berth ${berth.name} is removed from matchedBerths`);
            }
        }

        // If no berth is fully available for the entire time range, adjust ETA/ETD
        if (matchedBerths.length === 0) {
            console.log("No berth is available for the entire time range.");

            // Adjust ETA and ETD by 15 minutes
            let etaAdjustedDate = new Date(etaDate);
            let etdAdjustedDate = new Date(etdDate);
            etaAdjustedDate.setMinutes(etaAdjustedDate.getMinutes() + 15);
            etdAdjustedDate.setMinutes(etdAdjustedDate.getMinutes() + 15);

            console.log(
                `Adjusting ETA and ETD by 15 minutes: New ETA: ${etaAdjustedDate}, New ETD: ${etdAdjustedDate}`
            );

            // Create a new vesselVisitRequest with the adjusted ETA and ETD
            let vesselVisitRequestX = {
                imoNumber,
                loa,
                draft,
                cargoType,
                eta: etaAdjustedDate.toISOString(),
                etd: etdAdjustedDate.toISOString(),
            };

            // Recursively call checkFacilityAvailability with adjusted times
            return this.checkFacilityAvailability(vesselVisitRequestX);
        } else {
            // If a berth is available, return success with berth name and original ETA/ETD
            let assignedBerth = matchedBerths.pop();
            console.log(
                "The berth that has been assigned to the vessel is " +
                assignedBerth.name
            );
            // Update the assignedBerth's bookedPeriod map. key: vessel's IMO number value: [eta, etd]
            assignedBerth.bookedPeriod[imoNumber] = [etaDate.toISOString(), etdDate.toISOString()];
            // Set the document in Firestore
            const toBeUpdatedDocRef = db.collection("portConfigurations").doc(assignedBerth.name);
            await toBeUpdatedDocRef.set(assignedBerth)
                .then(() => {
                    console.log("Document successfully replaced");
                })
                .catch((error) => {
                    console.error("Error replacing document: ", error);
                });
            return {
                success: true,
                assignedBerth: assignedBerth.name,
                adjustedEta: eta,
                adjustedEtd: etd,
            };
        }
    }
}

module.exports = FacilityService;