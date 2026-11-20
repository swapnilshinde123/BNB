// Places guests can search for even where Gomzo has no homes yet. Searching one shows a
// "coming soon" message instead of an empty result. [name, state, other spellings]
export type IndiaPlace = [name: string, state: string, aliases?: string[]];

const MH = 'Maharashtra';
export const INDIA_CITIES: IndiaPlace[] = [
  // Maharashtra: every district headquarters plus popular getaways
  ['Mumbai', MH, ['Bombay']], ['Navi Mumbai', MH], ['Thane', MH], ['Pune', MH, ['Poona']], ['Pimpri-Chinchwad', MH, ['PCMC', 'Pimpri', 'Chinchwad']],
  ['Nagpur', MH], ['Nashik', MH, ['Nasik']], ['Aurangabad', MH, ['Chhatrapati Sambhajinagar', 'Sambhajinagar']], ['Ahmednagar', MH, ['Ahilyanagar', 'Ahmadnagar', 'Nagar']],
  ['Solapur', MH, ['Sholapur']], ['Kolhapur', MH], ['Sangli', MH], ['Satara', MH], ['Ratnagiri', MH], ['Sindhudurg', MH], ['Raigad', MH, ['Alibag', 'Alibaug']],
  ['Palghar', MH], ['Dhule', MH], ['Jalgaon', MH], ['Nandurbar', MH], ['Amravati', MH], ['Akola', MH], ['Washim', MH], ['Buldhana', MH], ['Yavatmal', MH],
  ['Wardha', MH], ['Chandrapur', MH], ['Gadchiroli', MH], ['Gondia', MH], ['Bhandara', MH], ['Latur', MH], ['Osmanabad', MH, ['Dharashiv']], ['Beed', MH, ['Bid']],
  ['Jalna', MH], ['Parbhani', MH], ['Hingoli', MH], ['Nanded', MH], ['Lonavala', MH, ['Lonavla', 'Khandala']], ['Mahabaleshwar', MH], ['Panchgani', MH],
  ['Matheran', MH], ['Shirdi', MH], ['Igatpuri', MH], ['Karjat', MH], ['Kashid', MH], ['Dapoli', MH], ['Ganpatipule', MH], ['Tarkarli', MH, ['Malvan']],
  ['Bhimashankar', MH], ['Lavasa', MH], ['Kalyan', MH], ['Dombivli', MH], ['Vasai-Virar', MH, ['Vasai', 'Virar']], ['Baramati', MH], ['Shirur', MH], ['Talegaon', MH], ['Chakan', MH],
  // Goa
  ['Goa', 'Goa'], ['North Goa', 'Goa'], ['South Goa', 'Goa'], ['Panaji', 'Goa', ['Panjim']], ['Margao', 'Goa', ['Madgaon']], ['Vasco da Gama', 'Goa'], ['Mapusa', 'Goa'],
  ['Calangute', 'Goa'], ['Baga', 'Goa'], ['Anjuna', 'Goa'], ['Candolim', 'Goa'], ['Arambol', 'Goa'], ['Palolem', 'Goa'], ['Colva', 'Goa'],
  // Karnataka
  ['Bengaluru', 'Karnataka', ['Bangalore']], ['Mysuru', 'Karnataka', ['Mysore']], ['Mangaluru', 'Karnataka', ['Mangalore']], ['Hubballi', 'Karnataka', ['Hubli']], ['Dharwad', 'Karnataka'],
  ['Belagavi', 'Karnataka', ['Belgaum']], ['Coorg', 'Karnataka', ['Kodagu', 'Madikeri']], ['Chikmagalur', 'Karnataka', ['Chikkamagaluru']], ['Hampi', 'Karnataka'], ['Udupi', 'Karnataka'], ['Gokarna', 'Karnataka'],
  // Gujarat
  ['Ahmedabad', 'Gujarat', ['Amdavad']], ['Surat', 'Gujarat'], ['Vadodara', 'Gujarat', ['Baroda']], ['Rajkot', 'Gujarat'], ['Gandhinagar', 'Gujarat'], ['Bhavnagar', 'Gujarat'], ['Jamnagar', 'Gujarat'],
  ['Dwarka', 'Gujarat'], ['Somnath', 'Gujarat'], ['Kutch', 'Gujarat', ['Bhuj']], ['Saputara', 'Gujarat'],
  // Delhi NCR
  ['New Delhi', 'Delhi', ['Delhi']], ['Gurugram', 'Haryana', ['Gurgaon']], ['Noida', 'Uttar Pradesh'], ['Greater Noida', 'Uttar Pradesh'], ['Ghaziabad', 'Uttar Pradesh'], ['Faridabad', 'Haryana'],
  // Rajasthan
  ['Jaipur', 'Rajasthan'], ['Udaipur', 'Rajasthan'], ['Jodhpur', 'Rajasthan'], ['Jaisalmer', 'Rajasthan'], ['Pushkar', 'Rajasthan'], ['Ajmer', 'Rajasthan'], ['Mount Abu', 'Rajasthan'],
  ['Bikaner', 'Rajasthan'], ['Kota', 'Rajasthan'], ['Ranthambore', 'Rajasthan', ['Sawai Madhopur']],
  // Tamil Nadu, Kerala, Telangana, Andhra
  ['Chennai', 'Tamil Nadu', ['Madras']], ['Coimbatore', 'Tamil Nadu'], ['Madurai', 'Tamil Nadu'], ['Ooty', 'Tamil Nadu', ['Udhagamandalam']], ['Kodaikanal', 'Tamil Nadu'], ['Pondicherry', 'Puducherry', ['Puducherry']],
  ['Mahabalipuram', 'Tamil Nadu', ['Mamallapuram']], ['Tiruchirappalli', 'Tamil Nadu', ['Trichy']], ['Kanyakumari', 'Tamil Nadu'], ['Rameswaram', 'Tamil Nadu'],
  ['Kochi', 'Kerala', ['Cochin']], ['Thiruvananthapuram', 'Kerala', ['Trivandrum']], ['Munnar', 'Kerala'], ['Alappuzha', 'Kerala', ['Alleppey']], ['Wayanad', 'Kerala'], ['Varkala', 'Kerala'], ['Kozhikode', 'Kerala', ['Calicut']], ['Thrissur', 'Kerala'],
  ['Hyderabad', 'Telangana'], ['Secunderabad', 'Telangana'], ['Warangal', 'Telangana'], ['Visakhapatnam', 'Andhra Pradesh', ['Vizag']], ['Vijayawada', 'Andhra Pradesh'], ['Tirupati', 'Andhra Pradesh'], ['Araku Valley', 'Andhra Pradesh'],
  // North and hills
  ['Shimla', 'Himachal Pradesh'], ['Manali', 'Himachal Pradesh'], ['Dharamshala', 'Himachal Pradesh', ['McLeod Ganj', 'Mcleodganj']], ['Kasol', 'Himachal Pradesh'], ['Dalhousie', 'Himachal Pradesh'], ['Kasauli', 'Himachal Pradesh'], ['Spiti', 'Himachal Pradesh'],
  ['Dehradun', 'Uttarakhand'], ['Mussoorie', 'Uttarakhand'], ['Rishikesh', 'Uttarakhand'], ['Haridwar', 'Uttarakhand'], ['Nainital', 'Uttarakhand'], ['Jim Corbett', 'Uttarakhand', ['Corbett', 'Ramnagar']], ['Auli', 'Uttarakhand'],
  ['Srinagar', 'Jammu and Kashmir'], ['Gulmarg', 'Jammu and Kashmir'], ['Pahalgam', 'Jammu and Kashmir'], ['Jammu', 'Jammu and Kashmir'], ['Leh', 'Ladakh', ['Ladakh']],
  ['Chandigarh', 'Chandigarh'], ['Amritsar', 'Punjab'], ['Ludhiana', 'Punjab'], ['Jalandhar', 'Punjab'],
  // Uttar Pradesh, Madhya Pradesh, Chhattisgarh
  ['Lucknow', 'Uttar Pradesh'], ['Varanasi', 'Uttar Pradesh', ['Banaras', 'Kashi']], ['Agra', 'Uttar Pradesh'], ['Prayagraj', 'Uttar Pradesh', ['Allahabad']], ['Kanpur', 'Uttar Pradesh'], ['Mathura', 'Uttar Pradesh'], ['Vrindavan', 'Uttar Pradesh'], ['Ayodhya', 'Uttar Pradesh'],
  ['Indore', 'Madhya Pradesh'], ['Bhopal', 'Madhya Pradesh'], ['Jabalpur', 'Madhya Pradesh'], ['Gwalior', 'Madhya Pradesh'], ['Ujjain', 'Madhya Pradesh'], ['Khajuraho', 'Madhya Pradesh'], ['Pachmarhi', 'Madhya Pradesh'],
  ['Raipur', 'Chhattisgarh'], ['Bilaspur', 'Chhattisgarh'],
  // East and North-east
  ['Kolkata', 'West Bengal', ['Calcutta']], ['Darjeeling', 'West Bengal'], ['Siliguri', 'West Bengal'], ['Kalimpong', 'West Bengal'],
  ['Bhubaneswar', 'Odisha'], ['Puri', 'Odisha'], ['Cuttack', 'Odisha'], ['Patna', 'Bihar'], ['Bodh Gaya', 'Bihar'], ['Ranchi', 'Jharkhand'], ['Jamshedpur', 'Jharkhand'],
  ['Guwahati', 'Assam'], ['Kaziranga', 'Assam'], ['Shillong', 'Meghalaya'], ['Cherrapunji', 'Meghalaya', ['Sohra']], ['Gangtok', 'Sikkim'], ['Tawang', 'Arunachal Pradesh'],
  ['Imphal', 'Manipur'], ['Aizawl', 'Mizoram'], ['Kohima', 'Nagaland'], ['Agartala', 'Tripura'], ['Port Blair', 'Andaman and Nicobar Islands', ['Sri Vijaya Puram']], ['Havelock Island', 'Andaman and Nicobar Islands', ['Swaraj Dweep']],
];

// Pune neighbourhoods guests often ask for, even before Gomzo has homes there.
export const PUNE_AREAS = ['Koregaon Park', 'Kalyani Nagar', 'Viman Nagar', 'Kharadi', 'Hadapsar', 'Magarpatta', 'Baner', 'Balewadi', 'Aundh', 'Pashan', 'Wakad', 'Hinjewadi',
  'Kothrud', 'Shivajinagar', 'Deccan', 'Camp', 'Wanowrie', 'Kondhwa', 'NIBM Road', 'Undri', 'Bavdhan', 'Pimple Saudagar', 'Yerawada', 'Sus', 'Lohegaon'];
