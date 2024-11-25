import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-[#1e3d58] opacity-30" />
          </Transition.Child>

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gradient-to-b from-[#e8eef1] to-white shadow-xl rounded-2xl">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-[#1e3d58]"
              >
                {title}
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-[#1e3d58]/70">
                  {message}
                </p>
              </div>

              <div className="mt-4 flex justify-end space-x-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-[#1e3d58] bg-[#e8eef1] border border-transparent rounded-md hover:bg-[#e8eef1]/80 focus:outline-none transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#43b0f1] to-[#057dcd] border border-transparent rounded-md hover:from-[#057dcd] hover:to-[#43b0f1] focus:outline-none transition-all"
                  onClick={onConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default ConfirmModal; 