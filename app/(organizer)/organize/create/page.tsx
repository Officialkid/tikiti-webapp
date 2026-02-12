'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';
import { createEventSchema, CreateEventFormData } from '@/lib/validations/event';
import { eventService } from '@/lib/services/eventService';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CalendarIcon,
  MapPinIcon,
  TicketIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

type TicketTypeRow = {
  type: 'Regular' | 'VIP' | 'VVIP' | 'Gold' | 'Platinum';
  price: number;
  quantity: number;
  description?: string;
};

const KENYAN_CITIES = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Kitale',
];

const STEP_ICONS = [
  { icon: CalendarIcon, title: 'Basic Info' },
  { icon: MapPinIcon, title: 'Date & Location' },
  { icon: TicketIcon, title: 'Tickets' },
  { icon: PhotoIcon, title: 'Review & Submit' },
];

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      category: 'campus',
      hasVirtualTickets: false,
      ticketTypes: [{ type: 'Regular', price: 0, quantity: 1, description: '' }],
      tags: '',
    },
  });

  const ticketTypes = watch('ticketTypes') || [];

  const addTicketType = () => {
    setValue('ticketTypes', [
      ...ticketTypes,
      { type: 'Regular', price: 0, quantity: 1, description: '' },
    ]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length === 1) {
      toast.error('You must have at least one ticket type');
      return;
    }
    setValue(
      'ticketTypes',
      ticketTypes.filter((_, i) => i !== index)
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof CreateEventFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ['title', 'description', 'category', 'tags'];
        break;
      case 2:
        fieldsToValidate = [
          'date',
          'time',
          'venueName',
          'address',
          'city',
          'venueCapacity',
          'hasVirtualTickets',
        ];
        break;
      case 3:
        fieldsToValidate = ['ticketTypes'];
        break;
      case 4:
        return true; // Review step, no validation needed
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error('Please fix the errors before continuing');
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: CreateEventFormData) => {
    if (!user) {
      toast.error('You must be logged in to create an event');
      router.push('/login');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload an event image');
      setCurrentStep(4);
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const dateTime = new Date(`${data.date}T${data.time}`);
      
      // Parse tags
      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Prepare event data
      const eventData = {
        title: data.title,
        description: data.description,
        category: data.category,
        dateTime: dateTime,
        location: {
          venue: data.venueName,
          address: data.address,
          city: data.city,
        },
        venueCapacity: data.venueCapacity,
        ticketTypes: data.ticketTypes,
        tags: tags,
        hasVirtualTickets: data.hasVirtualTickets,
        imageFile: imageFile,
      };

      // Create event with all required arguments
      await eventService.createEvent(
        eventData,
        user.uid,
        user.displayName || user.email || 'Unknown Organizer'
      );

      toast.success('Event submitted for review!');
      router.push('/organize');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formData = watch();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            Create New Event
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fill in the details to list your event on Tikiti
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEP_ICONS.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              const StepIcon = step.icon;

              return (
                <div key={stepNumber} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isActive || isCompleted
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {stepNumber < 4 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        isCompleted
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            Step {currentStep} of 4
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Basic Information
                  </h2>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Title *
                    </label>
                    <input
                      {...register('title')}
                      type="text"
                      placeholder="e.g., Campus Fest 2026"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      {...register('description')}
                      rows={6}
                      placeholder="Describe your event in detail..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      {...register('category')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="campus">🎓 Campus</option>
                      <option value="concert">🎵 Concert</option>
                      <option value="festival">🎪 Festival</option>
                      <option value="sports">⚽ Sports</option>
                      <option value="comedy">😂 Comedy</option>
                      <option value="networking">🤝 Networking</option>
                      <option value="other">📌 Other</option>
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      {...register('tags')}
                      type="text"
                      placeholder="e.g., music, outdoor, food"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Separate tags with commas
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Date & Location */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Date & Location
                  </h2>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date *
                      </label>
                      <input
                        {...register('date')}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.date && (
                        <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Time *
                      </label>
                      <input
                        {...register('time')}
                        type="time"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.time && (
                        <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Venue Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Venue Name *
                    </label>
                    <input
                      {...register('venueName')}
                      type="text"
                      placeholder="e.g., KICC Grounds"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.venueName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.venueName.message}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address *
                    </label>
                    <input
                      {...register('address')}
                      type="text"
                      placeholder="e.g., Harambee Avenue"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  {/* City & Capacity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        City *
                      </label>
                      <select
                        {...register('city')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select a city</option>
                        {KENYAN_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Venue Capacity *
                      </label>
                      <input
                        {...register('venueCapacity', { valueAsNumber: true })}
                        type="number"
                        min="10"
                        placeholder="e.g., 500"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.venueCapacity && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.venueCapacity.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Virtual Tickets */}
                  <div className="flex items-center gap-3">
                    <input
                      {...register('hasVirtualTickets')}
                      type="checkbox"
                      id="hasVirtualTickets"
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label
                      htmlFor="hasVirtualTickets"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      This event has virtual tickets (online streaming)
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Tickets */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Ticket Types
                    </h2>
                    <button
                      type="button"
                      onClick={addTicketType}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add Ticket Type
                    </button>
                  </div>

                  <div className="space-y-4">
                    {ticketTypes.map((ticket, index) => (
                      <div
                        key={index}
                        className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Ticket Type #{index + 1}
                          </h3>
                          {ticketTypes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTicketType(index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Type *
                            </label>
                            <select
                              {...register(`ticketTypes.${index}.type`)}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="Regular">Regular</option>
                              <option value="VIP">VIP</option>
                              <option value="VVIP">VVIP</option>
                              <option value="Gold">Gold</option>
                              <option value="Platinum">Platinum</option>
                            </select>
                          </div>

                          {/* Price */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Price (Ksh) *
                            </label>
                            <input
                              {...register(`ticketTypes.${index}.price`, {
                                valueAsNumber: true,
                              })}
                              type="number"
                              min="0"
                              placeholder="0"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Quantity *
                            </label>
                            <input
                              {...register(`ticketTypes.${index}.quantity`, {
                                valueAsNumber: true,
                              })}
                              type="number"
                              min="1"
                              placeholder="1"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description (optional)
                          </label>
                          <input
                            {...register(`ticketTypes.${index}.description`)}
                            type="text"
                            placeholder="e.g., Includes backstage access"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>

                        {errors.ticketTypes?.[index] && (
                          <div className="mt-2 text-red-500 text-sm">
                            {errors.ticketTypes[index]?.price?.message ||
                              errors.ticketTypes[index]?.quantity?.message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {errors.ticketTypes && (
                    <p className="text-red-500 text-sm">
                      {errors.ticketTypes.message}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Review & Submit
                  </h2>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Image *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
                      {imagePreview ? (
                        <div className="space-y-4">
                          <div className="relative w-full h-64 rounded-lg overflow-hidden">
                            <Image
                              src={imagePreview}
                              alt="Event preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div>
                          <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <label className="cursor-pointer">
                            <span className="text-primary-600 hover:text-primary-700 font-medium">
                              Upload an image
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            PNG, JPG, WEBP up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Summary */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Event Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Title:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formData.title || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Category:</span>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {formData.category}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Date:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formData.date || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Time:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formData.time || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Venue:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formData.venueName || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">City:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formData.city || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Capacity:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formData.venueCapacity || 0} people
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Ticket Types:
                        </span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {ticketTypes.length} type(s)
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Description:</span>
                      <p className="font-semibold text-gray-900 dark:text-white mt-1">
                        {formData.description || 'Not set'}
                      </p>
                    </div>

                    {ticketTypes.length > 0 && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-2">
                          Tickets:
                        </span>
                        <div className="space-y-2">
                          {ticketTypes.map((ticket, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg"
                            >
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {ticket.type}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                Ksh {ticket.price} × {ticket.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                Next
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !imageFile}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Submit Event
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
