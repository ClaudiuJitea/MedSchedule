"""
Doctor Appointment Scheduler - Premium Edition
A modern web application for scheduling doctor appointments with review system,
favorites, availability calendar, and premium UI features.
"""

from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
import random

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///appointments.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

db = SQLAlchemy(app)

# Database Models
class Specialty(db.Model):
    __tablename__ = 'specialties'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    doctors = db.relationship('Doctor', backref='specialty', lazy=True)

class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    specialty_id = db.Column(db.Integer, db.ForeignKey('specialties.id'), nullable=False)
    email = db.Column(db.String(100), unique=True)
    phone = db.Column(db.String(20))
    bio = db.Column(db.Text)
    image_url = db.Column(db.String(200))
    rating = db.Column(db.Float, default=0.0)
    review_count = db.Column(db.Integer, default=0)
    # Premium features
    estimated_wait_time = db.Column(db.Integer, default=15)  # minutes
    consultation_types = db.Column(db.String(200), default='in-person,video,phone')  # comma-separated
    is_verified = db.Column(db.Boolean, default=True)
    years_experience = db.Column(db.Integer, default=5)
    appointments = db.relationship('Appointment', backref='doctor', lazy=True)
    availability = db.relationship('DoctorAvailability', backref='doctor', lazy=True, cascade='all, delete-orphan')
    
    @property
    def full_name(self):
        return f"Dr. {self.first_name} {self.last_name}"
    
    def update_rating(self):
        reviews = Review.query.filter_by(doctor_id=self.id).all()
        if reviews:
            self.rating = round(sum(r.rating for r in reviews) / len(reviews), 1)
            self.review_count = len(reviews)
        else:
            self.rating = 0.0
            self.review_count = 0
        db.session.commit()
    
    def get_consultation_types_list(self):
        return self.consultation_types.split(',') if self.consultation_types else ['in-person']

class Patient(db.Model):
    __tablename__ = 'patients'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    appointments = db.relationship('Appointment', backref='patient', lazy=True)
    favorites = db.relationship('FavoriteDoctor', backref='patient', lazy=True, cascade='all, delete-orphan')

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, completed, cancelled, rescheduled
    reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    appointment_type = db.Column(db.String(20), default='in-person')  # in-person, video, phone
    reschedule_count = db.Column(db.Integer, default=0)
    original_appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    review = db.relationship('Review', backref='appointment', uselist=False, lazy=True)

class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FavoriteDoctor(db.Model):
    __tablename__ = 'favorite_doctors'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure a patient can only favorite a doctor once
    __table_args__ = (db.UniqueConstraint('patient_id', 'doctor_id', name='unique_patient_doctor_favorite'),)

class DoctorAvailability(db.Model):
    __tablename__ = 'doctor_availability'
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    is_available = db.Column(db.Boolean, default=True)

# Initialize database with sample data
def init_db():
    with app.app_context():
        db.create_all()
        
        # Add sample specialties if none exist
        if not Specialty.query.first():
            specialties = [
                Specialty(name='Cardiology', description='Heart and cardiovascular system'),
                Specialty(name='Dermatology', description='Skin, hair, and nail conditions'),
                Specialty(name='Pediatrics', description='Medical care for infants, children, and adolescents'),
                Specialty(name='Orthopedics', description='Musculoskeletal system and injuries'),
                Specialty(name='Neurology', description='Brain, spine, and nervous system disorders'),
                Specialty(name='General Medicine', description='Primary healthcare and general checkups'),
                Specialty(name='Ophthalmology', description='Eye care and vision health'),
                Specialty(name='Dentistry', description='Oral health and dental care')
            ]
            db.session.add_all(specialties)
            db.session.commit()
        
        # Add sample doctors if none exist
        if not Doctor.query.first():
            specialties = Specialty.query.all()
            doctors_data = [
                {
                    'first_name': 'Sarah', 'last_name': 'Johnson', 'specialty_id': specialties[0].id,
                    'email': 'sarah.johnson@clinic.com', 'phone': '555-0101',
                    'bio': 'Board-certified cardiologist with 15 years of experience in interventional cardiology. Specializes in heart rhythm disorders and heart failure management.',
                    'wait_time': 10, 'consultation_types': 'in-person,video', 'years_experience': 15
                },
                {
                    'first_name': 'Michael', 'last_name': 'Chen', 'specialty_id': specialties[1].id,
                    'email': 'michael.chen@clinic.com', 'phone': '555-0102',
                    'bio': 'Expert in cosmetic dermatology and skin cancer treatment. Board certified with advanced training in laser procedures and Mohs surgery.',
                    'wait_time': 20, 'consultation_types': 'in-person,video,phone', 'years_experience': 12
                },
                {
                    'first_name': 'Emily', 'last_name': 'Williams', 'specialty_id': specialties[2].id,
                    'email': 'emily.williams@clinic.com', 'phone': '555-0103',
                    'bio': 'Compassionate pediatrician specializing in child development and preventive care. Dedicated to providing family-centered healthcare.',
                    'wait_time': 5, 'consultation_types': 'in-person,video,phone', 'years_experience': 8
                },
                {
                    'first_name': 'David', 'last_name': 'Brown', 'specialty_id': specialties[3].id,
                    'email': 'david.brown@clinic.com', 'phone': '555-0104',
                    'bio': 'Orthopedic surgeon specializing in sports medicine and joint replacement. Former team physician for professional sports teams.',
                    'wait_time': 15, 'consultation_types': 'in-person', 'years_experience': 20
                },
                {
                    'first_name': 'Lisa', 'last_name': 'Anderson', 'specialty_id': specialties[4].id,
                    'email': 'lisa.anderson@clinic.com', 'phone': '555-0105',
                    'bio': 'Neurologist with expertise in headache disorders and epilepsy. Conducts cutting-edge research in neurological treatments.',
                    'wait_time': 25, 'consultation_types': 'in-person,video', 'years_experience': 14
                },
                {
                    'first_name': 'James', 'last_name': 'Wilson', 'specialty_id': specialties[5].id,
                    'email': 'james.wilson@clinic.com', 'phone': '555-0106',
                    'bio': 'Family medicine physician focused on preventive care and chronic disease management. Emphasizes holistic patient wellness.',
                    'wait_time': 8, 'consultation_types': 'in-person,video,phone', 'years_experience': 10
                },
                {
                    'first_name': 'Maria', 'last_name': 'Garcia', 'specialty_id': specialties[6].id,
                    'email': 'maria.garcia@clinic.com', 'phone': '555-0107',
                    'bio': 'Ophthalmologist specializing in cataract surgery and glaucoma treatment. State-of-the-art facility with latest diagnostic technology.',
                    'wait_time': 12, 'consultation_types': 'in-person', 'years_experience': 18
                },
                {
                    'first_name': 'Robert', 'last_name': 'Taylor', 'specialty_id': specialties[7].id,
                    'email': 'robert.taylor@clinic.com', 'phone': '555-0108',
                    'bio': 'Experienced dentist providing comprehensive dental care including cosmetic dentistry, implants, and orthodontics.',
                    'wait_time': 5, 'consultation_types': 'in-person', 'years_experience': 16
                }
            ]
            
            doctors = []
            for doc_data in doctors_data:
                doctor = Doctor(
                    first_name=doc_data['first_name'],
                    last_name=doc_data['last_name'],
                    specialty_id=doc_data['specialty_id'],
                    email=doc_data['email'],
                    phone=doc_data['phone'],
                    bio=doc_data['bio'],
                    estimated_wait_time=doc_data['wait_time'],
                    consultation_types=doc_data['consultation_types'],
                    years_experience=doc_data['years_experience']
                )
                doctors.append(doctor)
                db.session.add(doctor)
            
            db.session.commit()
            
            # Add default availability for each doctor
            for doctor in doctors:
                for day in range(5):  # Monday to Friday
                    availability = DoctorAvailability(
                        doctor_id=doctor.id,
                        day_of_week=day,
                        start_time=datetime.strptime('09:00', '%H:%M').time(),
                        end_time=datetime.strptime('17:00', '%H:%M').time(),
                        is_available=True
                    )
                    db.session.add(availability)
            db.session.commit()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    """Serve a simple favicon to prevent 404 errors."""
    from flask import Response
    transparent_pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\xfc\xcf\xc0\x50\x0f\x00\x04A\x01\xa1\x3a\xf0\xfc\xcc\x00\x00\x00\x00IEND\xaeB`\x82'
    return Response(transparent_pixel, mimetype='image/png')

@app.route('/api/specialties')
def get_specialties():
    specialties = Specialty.query.all()
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'description': s.description
    } for s in specialties])

@app.route('/api/doctors')
def get_doctors():
    specialty_id = request.args.get('specialty_id', type=int)
    patient_email = request.args.get('patient_email')
    
    query = Doctor.query
    if specialty_id:
        query = query.filter_by(specialty_id=specialty_id)
    
    doctors = query.all()
    
    # Get patient's favorites if email provided
    favorite_doctor_ids = set()
    if patient_email:
        patient = Patient.query.filter_by(email=patient_email).first()
        if patient:
            favorites = FavoriteDoctor.query.filter_by(patient_id=patient.id).all()
            favorite_doctor_ids = {f.doctor_id for f in favorites}
    
    return jsonify([{
        'id': d.id,
        'full_name': d.full_name,
        'specialty': d.specialty.name,
        'specialty_id': d.specialty_id,
        'email': d.email,
        'phone': d.phone,
        'bio': d.bio,
        'rating': d.rating,
        'review_count': d.review_count,
        'estimated_wait_time': d.estimated_wait_time,
        'consultation_types': d.get_consultation_types_list(),
        'is_verified': d.is_verified,
        'years_experience': d.years_experience,
        'is_favorite': d.id in favorite_doctor_ids
    } for d in doctors])

@app.route('/api/doctors/<int:doctor_id>')
def get_doctor(doctor_id):
    doctor = Doctor.query.get_or_404(doctor_id)
    return jsonify({
        'id': doctor.id,
        'full_name': doctor.full_name,
        'specialty': doctor.specialty.name,
        'email': doctor.email,
        'phone': doctor.phone,
        'bio': doctor.bio,
        'rating': doctor.rating,
        'review_count': doctor.review_count,
        'estimated_wait_time': doctor.estimated_wait_time,
        'consultation_types': doctor.get_consultation_types_list(),
        'is_verified': doctor.is_verified,
        'years_experience': doctor.years_experience
    })

@app.route('/api/doctors/search')
def search_doctors():
    query = request.args.get('q', '').lower()
    if not query or len(query) < 2:
        return jsonify([])
    
    doctors = Doctor.query.filter(
        db.or_(
            db.func.lower(Doctor.first_name).contains(query),
            db.func.lower(Doctor.last_name).contains(query),
            db.func.lower(Doctor.first_name + ' ' + Doctor.last_name).contains(query)
        )
    ).limit(10).all()
    
    return jsonify([{
        'id': d.id,
        'full_name': d.full_name,
        'specialty': d.specialty.name,
        'rating': d.rating
    } for d in doctors])

@app.route('/api/doctors/<int:doctor_id>/availability')
def get_doctor_availability(doctor_id):
    """Get doctor's weekly availability schedule."""
    doctor = Doctor.query.get_or_404(doctor_id)
    availability = DoctorAvailability.query.filter_by(doctor_id=doctor_id).all()
    
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    availability_dict = {}
    
    for avail in availability:
        day_name = days[avail.day_of_week]
        if day_name not in availability_dict:
            availability_dict[day_name] = []
        availability_dict[day_name].append({
            'start': avail.start_time.strftime('%H:%M'),
            'end': avail.end_time.strftime('%H:%M'),
            'available': avail.is_available
        })
    
    return jsonify({
        'doctor_id': doctor_id,
        'doctor_name': doctor.full_name,
        'availability': availability_dict
    })

@app.route('/api/doctors/<int:doctor_id>/reviews')
def get_doctor_reviews(doctor_id):
    reviews = Review.query.filter_by(doctor_id=doctor_id).order_by(Review.created_at.desc()).all()
    return jsonify([{
        'id': r.id,
        'rating': r.rating,
        'comment': r.comment,
        'date': r.created_at.isoformat(),
        'patient_name': f"{r.patient.first_name} {r.patient.last_name[0]}."
    } for r in reviews])

# Favorites API
@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Email required'}), 400
    
    patient = Patient.query.filter_by(email=email).first()
    if not patient:
        return jsonify([])
    
    favorites = FavoriteDoctor.query.filter_by(patient_id=patient.id).all()
    doctor_ids = [f.doctor_id for f in favorites]
    doctors = Doctor.query.filter(Doctor.id.in_(doctor_ids)).all() if doctor_ids else []
    
    return jsonify([{
        'id': d.id,
        'full_name': d.full_name,
        'specialty': d.specialty.name,
        'rating': d.rating,
        'review_count': d.review_count
    } for d in doctors])

@app.route('/api/favorites', methods=['POST'])
def toggle_favorite():
    data = request.json
    email = data.get('email')
    doctor_id = data.get('doctor_id')
    
    if not email or not doctor_id:
        return jsonify({'error': 'Email and doctor_id required'}), 400
    
    patient = Patient.query.filter_by(email=email).first()
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404
    
    existing = FavoriteDoctor.query.filter_by(
        patient_id=patient.id,
        doctor_id=doctor_id
    ).first()
    
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'favorited': False, 'message': 'Removed from favorites'})
    else:
        favorite = FavoriteDoctor(patient_id=patient.id, doctor_id=doctor_id)
        db.session.add(favorite)
        db.session.commit()
        return jsonify({'favorited': True, 'message': 'Added to favorites'})

# Appointments API
@app.route('/api/appointments')
def get_appointments():
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Email required'}), 400
    
    patient = Patient.query.filter_by(email=email).first()
    if not patient:
        return jsonify([])
    
    appointments = Appointment.query.filter_by(patient_id=patient.id).order_by(Appointment.appointment_date.desc()).all()
    return jsonify([{
        'id': a.id,
        'doctor_id': a.doctor_id,
        'doctor_name': a.doctor.full_name,
        'specialty': a.doctor.specialty.name,
        'date': a.appointment_date.isoformat(),
        'status': a.status,
        'reason': a.reason,
        'appointment_type': a.appointment_type,
        'reschedule_count': a.reschedule_count,
        'can_review': a.status == 'completed' and not a.review,
        'can_reschedule': a.status == 'scheduled' and a.appointment_date > datetime.now(),
        'can_cancel': a.status == 'scheduled' and a.appointment_date > datetime.now(),
        'is_upcoming': a.appointment_date > datetime.now() and a.status == 'scheduled'
    } for a in appointments])

@app.route('/api/appointments/<int:appointment_id>')
def get_appointment(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    return jsonify({
        'id': appointment.id,
        'doctor_id': appointment.doctor_id,
        'doctor_name': appointment.doctor.full_name,
        'specialty': appointment.doctor.specialty.name,
        'date': appointment.appointment_date.isoformat(),
        'status': appointment.status,
        'reason': appointment.reason,
        'appointment_type': appointment.appointment_type,
        'patient_email': appointment.patient.email
    })

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    try:
        data = request.get_json(silent=True)
        
        if data is None:
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['doctorId', 'firstName', 'lastName', 'email', 'dateTime']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate and parse dateTime
        try:
            appointment_date = datetime.fromisoformat(data['dateTime'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Check for appointment overlap
        overlap_exists, conflicting = check_appointment_overlap(
            data['doctorId'], 
            appointment_date
        )
        
        if overlap_exists:
            conflict_time = conflicting.appointment_date.strftime('%I:%M %p')
            return jsonify({
                'error': f'This time slot overlaps with an existing appointment. '
                         f'The doctor already has an appointment at {conflict_time}.'
            }), 409
        
        # Create or get patient
        patient = Patient.query.filter_by(email=data['email']).first()
        if not patient:
            patient = Patient(
                first_name=data['firstName'],
                last_name=data['lastName'],
                email=data['email'],
                phone=data.get('phone', '') or ''
            )
            db.session.add(patient)
            db.session.commit()
        
        appointment = Appointment(
            doctor_id=data['doctorId'],
            patient_id=patient.id,
            appointment_date=appointment_date,
            reason=data.get('reason', '') or '',
            appointment_type=data.get('appointmentType', 'in-person'),
            status='scheduled'
        )
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'id': appointment.id,
            'message': 'Appointment scheduled successfully',
            'doctor_name': appointment.doctor.full_name,
            'date': appointment.appointment_date.isoformat()
        }), 201
    except Exception as e:
        import traceback
        print(f"Error in create_appointment: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/appointments/<int:appointment_id>/reschedule', methods=['POST'])
def reschedule_appointment(appointment_id):
    """Reschedule an existing appointment to a new time slot."""
    appointment = Appointment.query.get_or_404(appointment_id)
    data = request.json
    
    new_date_time = data.get('newDateTime')
    if not new_date_time:
        return jsonify({'error': 'New date/time required'}), 400
    
    try:
        new_date = datetime.fromisoformat(new_date_time)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid date format'}), 400
    
    # Check for overlap (excluding this appointment)
    overlap_exists, conflicting = check_appointment_overlap(
        appointment.doctor_id,
        new_date,
        exclude_appointment_id=appointment_id
    )
    
    if overlap_exists:
        conflict_time = conflicting.appointment_date.strftime('%I:%M %p')
        return jsonify({
            'error': f'This time slot overlaps with an existing appointment. '
                     f'The doctor already has an appointment at {conflict_time}.'
        }), 409
    
    # Update appointment
    appointment.appointment_date = new_date
    appointment.reschedule_count += 1
    appointment.status = 'rescheduled' if appointment.reschedule_count > 0 else 'scheduled'
    db.session.commit()
    
    return jsonify({
        'message': 'Appointment rescheduled successfully',
        'new_date': appointment.appointment_date.isoformat(),
        'reschedule_count': appointment.reschedule_count
    })

@app.route('/api/appointments/<int:appointment_id>/cancel', methods=['POST'])
def cancel_appointment(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    appointment.status = 'cancelled'
    db.session.commit()
    return jsonify({'message': 'Appointment cancelled'})

@app.route('/api/appointments/<int:appointment_id>/complete', methods=['POST'])
def complete_appointment(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    appointment.status = 'completed'
    db.session.commit()
    return jsonify({'message': 'Appointment marked as completed'})

@app.route('/api/appointments/upcoming')
def get_upcoming_appointments():
    """Get appointments within the next 24 hours for reminder notifications."""
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Email required'}), 400
    
    patient = Patient.query.filter_by(email=email).first()
    if not patient:
        return jsonify([])
    
    now = datetime.now()
    tomorrow = now + timedelta(hours=24)
    
    upcoming = Appointment.query.filter(
        Appointment.patient_id == patient.id,
        Appointment.status == 'scheduled',
        Appointment.appointment_date >= now,
        Appointment.appointment_date <= tomorrow
    ).all()
    
    return jsonify([{
        'id': a.id,
        'doctor_name': a.doctor.full_name,
        'date': a.appointment_date.isoformat(),
        'hours_until': round((a.appointment_date - now).total_seconds() / 3600, 1)
    } for a in upcoming])

@app.route('/api/reviews', methods=['POST'])
def create_review():
    data = request.json
    
    review = Review(
        appointment_id=data['appointmentId'],
        doctor_id=data['doctorId'],
        patient_id=data['patientId'],
        rating=data['rating'],
        comment=data.get('comment', '')
    )
    db.session.add(review)
    db.session.commit()
    
    # Update doctor rating
    doctor = Doctor.query.get(data['doctorId'])
    doctor.update_rating()
    
    return jsonify({'message': 'Review submitted successfully'}), 201

@app.route('/api/available-slots')
def get_available_slots():
    doctor_id = request.args.get('doctor_id', type=int)
    date_str = request.args.get('date')
    appointment_type = request.args.get('appointment_type', 'in-person')
    
    if not doctor_id or not date_str:
        return jsonify({'error': 'Doctor ID and date required'}), 400
    
    date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    # Get doctor's availability for this day
    day_of_week = date.weekday()
    availability = DoctorAvailability.query.filter_by(
        doctor_id=doctor_id,
        day_of_week=day_of_week,
        is_available=True
    ).first()
    
    if not availability:
        return jsonify([])  # Doctor not available on this day
    
    # Generate time slots based on availability
    slots = []
    start_hour = availability.start_time.hour
    end_hour = availability.end_time.hour
    
    for hour in range(start_hour, end_hour):
        for minute in [0, 30]:
            slot_time = datetime.combine(date, datetime.min.time().replace(hour=hour, minute=minute))
            
            # Check if slot is already booked
            existing = Appointment.query.filter(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == slot_time,
                Appointment.status != 'cancelled'
            ).first()
            
            if not existing and slot_time > datetime.now():
                slots.append({
                    'datetime': slot_time.isoformat(),
                    'time': slot_time.strftime('%I:%M %p'),
                    'available': True
                })
    
    return jsonify(slots)

@app.route('/api/email-preview', methods=['POST'])
def generate_email_preview():
    """Generate a mock email preview for booking confirmation."""
    data = request.json
    doctor_name = data.get('doctor_name', 'Your Doctor')
    appointment_date = data.get('date', 'TBD')
    appointment_time = data.get('time', 'TBD')
    appointment_type = data.get('appointment_type', 'in-person')
    patient_name = data.get('patient_name', 'Patient')
    
    type_icons = {
        'in-person': 'CLI',
        'video': 'VID',
        'phone': 'PH'
    }
    type_labels = {
        'in-person': 'In-Person Visit',
        'video': 'Video Consultation',
        'phone': 'Phone Consultation'
    }
    
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #0d9488; margin: 0;">MedSchedule</h2>
            <p style="color: #6b7280; margin: 8px 0 0;">Appointment Confirmation</p>
        </div>
        
        <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #374151;">Hello {patient_name},</p>
            <p style="margin: 0; color: #374151;">Your appointment has been confirmed!</p>
        </div>
        
        <div style="margin-bottom: 24px;">
            <h3 style="color: #111827; margin: 0 0 16px; font-size: 18px;">Appointment Details</h3>
            
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="width: 24px; margin-right: 12px; font-weight: bold; color: #6b7280;">DR</span>
                <div>
                    <p style="margin: 0; font-weight: 600; color: #374151;">{doctor_name}</p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">Your Healthcare Provider</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="width: 24px; margin-right: 12px; font-weight: bold; color: #6b7280;">CAL</span>
                <div>
                    <p style="margin: 0; font-weight: 600; color: #374151;">{appointment_date}</p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">Date</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="width: 24px; margin-right: 12px; font-weight: bold; color: #6b7280;">TI</span>
                <div>
                    <p style="margin: 0; font-weight: 600; color: #374151;">{appointment_time}</p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">Time</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: center;">
                <span style="width: 24px; margin-right: 12px; font-weight: bold; color: #6b7280;">TYP</span>
                <div>
                    <p style="margin: 0; font-weight: 600; color: #374151;">{type_labels.get(appointment_type, 'In-Person')}</p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">Consultation Type</p>
                </div>
            </div>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">Need to reschedule or cancel?</p>
            <a href="#" style="color: #0d9488; text-decoration: none; font-size: 12px;">Manage Appointment</a>
        </div>
    </div>
    """
    
    return jsonify({
        'html': email_html,
        'subject': f'Appointment Confirmed - {doctor_name}'
    })

# ============ ADMIN DASHBOARD ============

# IMPORTANT: Change this in production by setting the ADMIN_PASSWORD environment variable
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

def check_admin_auth():
    """Check if admin is authenticated via header."""
    auth_header = request.headers.get('X-Admin-Password')
    return auth_header == ADMIN_PASSWORD

@app.route('/admin')
def admin_dashboard():
    """Serve the admin dashboard page."""
    return render_template('admin.html')

@app.route('/api/admin/doctors', methods=['GET'])
def admin_get_doctors():
    """Get all doctors with full details for admin."""
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    doctors = Doctor.query.all()
    return jsonify([{
        'id': d.id,
        'first_name': d.first_name,
        'last_name': d.last_name,
        'full_name': d.full_name,
        'specialty': d.specialty.name,
        'specialty_id': d.specialty_id,
        'email': d.email,
        'phone': d.phone,
        'bio': d.bio,
        'rating': d.rating,
        'review_count': d.review_count,
        'appointment_count': len(d.appointments),
        'estimated_wait_time': d.estimated_wait_time,
        'consultation_types': d.get_consultation_types_list(),
        'is_verified': d.is_verified,
        'years_experience': d.years_experience
    } for d in doctors])

@app.route('/api/admin/doctors', methods=['POST'])
def admin_add_doctor():
    """Add a new doctor."""
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    required_fields = ['firstName', 'lastName', 'specialtyId', 'email']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    existing = Doctor.query.filter_by(email=data['email']).first()
    if existing:
        return jsonify({'error': 'A doctor with this email already exists'}), 409
    
    specialty = Specialty.query.get(data['specialtyId'])
    if not specialty:
        return jsonify({'error': 'Invalid specialty'}), 400
    
    doctor = Doctor(
        first_name=data['firstName'],
        last_name=data['lastName'],
        specialty_id=data['specialtyId'],
        email=data['email'],
        phone=data.get('phone', ''),
        bio=data.get('bio', ''),
        image_url=data.get('imageUrl', ''),
        estimated_wait_time=data.get('waitTime', 15),
        consultation_types=data.get('consultationTypes', 'in-person'),
        years_experience=data.get('yearsExperience', 5)
    )
    db.session.add(doctor)
    db.session.commit()
    
    # Add default availability
    for day in range(5):
        availability = DoctorAvailability(
            doctor_id=doctor.id,
            day_of_week=day,
            start_time=datetime.strptime('09:00', '%H:%M').time(),
            end_time=datetime.strptime('17:00', '%H:%M').time(),
            is_available=True
        )
        db.session.add(availability)
    db.session.commit()
    
    return jsonify({
        'id': doctor.id,
        'message': 'Doctor added successfully',
        'full_name': doctor.full_name
    }), 201

@app.route('/api/admin/doctors/<int:doctor_id>', methods=['PUT'])
def admin_update_doctor(doctor_id):
    """Update a doctor's information."""
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    doctor = Doctor.query.get_or_404(doctor_id)
    data = request.get_json()
    
    if data.get('email') and data['email'] != doctor.email:
        existing = Doctor.query.filter_by(email=data['email']).first()
        if existing:
            return jsonify({'error': 'A doctor with this email already exists'}), 409
        doctor.email = data['email']
    
    if data.get('firstName'):
        doctor.first_name = data['firstName']
    if data.get('lastName'):
        doctor.last_name = data['lastName']
    if data.get('specialtyId'):
        specialty = Specialty.query.get(data['specialtyId'])
        if not specialty:
            return jsonify({'error': 'Invalid specialty'}), 400
        doctor.specialty_id = data['specialtyId']
    if 'phone' in data:
        doctor.phone = data['phone']
    if 'bio' in data:
        doctor.bio = data['bio']
    if 'imageUrl' in data:
        doctor.image_url = data['imageUrl']
    if 'waitTime' in data:
        doctor.estimated_wait_time = data['waitTime']
    if 'consultationTypes' in data:
        doctor.consultation_types = data['consultationTypes']
    if 'yearsExperience' in data:
        doctor.years_experience = data['yearsExperience']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Doctor updated successfully',
        'doctor': {
            'id': doctor.id,
            'full_name': doctor.full_name,
            'email': doctor.email,
            'specialty': doctor.specialty.name
        }
    })

@app.route('/api/admin/doctors/<int:doctor_id>', methods=['DELETE'])
def admin_delete_doctor(doctor_id):
    """Delete a doctor."""
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    doctor = Doctor.query.get_or_404(doctor_id)
    
    scheduled_appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status == 'scheduled'
    ).count()
    
    if scheduled_appointments > 0:
        return jsonify({
            'error': f'Cannot delete doctor with {scheduled_appointments} scheduled appointments. Cancel them first.'
        }), 409
    
    Appointment.query.filter_by(doctor_id=doctor_id).delete()
    Review.query.filter_by(doctor_id=doctor_id).delete()
    DoctorAvailability.query.filter_by(doctor_id=doctor_id).delete()
    FavoriteDoctor.query.filter_by(doctor_id=doctor_id).delete()
    
    db.session.delete(doctor)
    db.session.commit()
    
    return jsonify({'message': f'Doctor {doctor.full_name} deleted successfully'})

@app.route('/api/admin/stats')
def admin_get_stats():
    """Get dashboard statistics."""
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    total_doctors = Doctor.query.count()
    total_patients = Patient.query.count()
    total_appointments = Appointment.query.count()
    scheduled_appointments = Appointment.query.filter_by(status='scheduled').count()
    completed_appointments = Appointment.query.filter_by(status='completed').count()
    cancelled_appointments = Appointment.query.filter_by(status='cancelled').count()
    total_reviews = Review.query.count()
    
    recent_appointments = Appointment.query.order_by(Appointment.created_at.desc()).limit(10).all()
    
    def get_patient_name(apt):
        if apt.patient:
            return f"{apt.patient.first_name} {apt.patient.last_name}"
        return "Unknown Patient"
    
    def get_doctor_name(apt):
        if apt.doctor:
            return apt.doctor.full_name
        return "Unknown Doctor"
    
    return jsonify({
        'stats': {
            'total_doctors': total_doctors,
            'total_patients': total_patients,
            'total_appointments': total_appointments,
            'scheduled_appointments': scheduled_appointments,
            'completed_appointments': completed_appointments,
            'cancelled_appointments': cancelled_appointments,
            'total_reviews': total_reviews
        },
        'recent_appointments': [{
            'id': a.id,
            'patient_name': get_patient_name(a),
            'doctor_name': get_doctor_name(a),
            'date': a.appointment_date.isoformat(),
            'status': a.status,
            'created_at': a.created_at.isoformat() if a.created_at else None
        } for a in recent_appointments]
    })

@app.route('/api/admin/appointments')
def admin_get_appointments():
    """Get all appointments with optional filtering."""
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Appointment.query
    
    if status and status != 'all':
        query = query.filter_by(status=status)
    
    query = query.order_by(Appointment.appointment_date.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    def get_patient_name(apt):
        if apt.patient:
            return f"{apt.patient.first_name} {apt.patient.last_name}"
        return "Unknown Patient"
    
    def get_doctor_name(apt):
        if apt.doctor:
            return apt.doctor.full_name
        return "Unknown Doctor"
    
    def get_patient_email(apt):
        if apt.patient:
            return apt.patient.email
        return ""
    
    def get_patient_phone(apt):
        if apt.patient:
            return apt.patient.phone or ""
        return ""
    
    return jsonify({
        'appointments': [{
            'id': a.id,
            'patient_name': get_patient_name(a),
            'patient_email': get_patient_email(a),
            'patient_phone': get_patient_phone(a),
            'doctor_name': get_doctor_name(a),
            'doctor_id': a.doctor_id,
            'date': a.appointment_date.isoformat(),
            'status': a.status,
            'reason': a.reason or '',
            'appointment_type': a.appointment_type,
            'created_at': a.created_at.isoformat() if a.created_at else None
        } for a in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'has_prev': pagination.has_prev,
        'has_next': pagination.has_next
    })

@app.route('/api/admin/appointments/<int:appointment_id>', methods=['DELETE'])
def admin_delete_appointment(appointment_id):
    """Delete an appointment."""
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    appointment = Appointment.query.get_or_404(appointment_id)
    
    if appointment.review:
        db.session.delete(appointment.review)
    
    db.session.delete(appointment)
    db.session.commit()
    
    return jsonify({'message': 'Appointment deleted successfully'})


@app.route('/api/admin/patients', methods=['GET'])
def admin_get_patients():
    """Get all patients with their appointment statistics."""
    if not check_admin_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    patients = Patient.query.all()
    result = []
    
    for patient in patients:
        # Get appointment count
        appointment_count = Appointment.query.filter_by(patient_id=patient.id).count()
        
        # Get last visit (most recent appointment)
        last_appointment = Appointment.query.filter_by(
            patient_id=patient.id
        ).order_by(Appointment.appointment_date.desc()).first()
        
        last_visit = None
        if last_appointment:
            last_visit = last_appointment.appointment_date.strftime('%Y-%m-%d')
        
        result.append({
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'email': patient.email,
            'phone': patient.phone or 'N/A',
            'appointment_count': appointment_count,
            'last_visit': last_visit or 'Never'
        })
    
    return jsonify(result)


# ============ APPOINTMENT OVERLAP PREVENTION ============

APPOINTMENT_DURATION_MINUTES = 30

def check_appointment_overlap(doctor_id, appointment_date, exclude_appointment_id=None):
    """
    Check if a new appointment would overlap with existing appointments.
    Returns (overlap_exists, conflicting_appointment) tuple.
    """
    new_start = appointment_date
    new_end = appointment_date + timedelta(minutes=APPOINTMENT_DURATION_MINUTES)
    
    same_day_start = new_start.replace(hour=0, minute=0, second=0, microsecond=0)
    same_day_end = same_day_start + timedelta(days=1)
    
    query = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date >= same_day_start,
        Appointment.appointment_date < same_day_end,
        Appointment.status != 'cancelled'
    )
    
    if exclude_appointment_id:
        query = query.filter(Appointment.id != exclude_appointment_id)
    
    existing_appointments = query.all()
    
    for existing in existing_appointments:
        existing_start = existing.appointment_date
        existing_end = existing_start + timedelta(minutes=APPOINTMENT_DURATION_MINUTES)
        
        if new_start < existing_end and new_end > existing_start:
            return True, existing
    
    return False, None

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
